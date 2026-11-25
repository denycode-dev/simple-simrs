import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildApp } from "../src/app.js";
import { createTestConfig, MockDatabasePool } from "./helpers/mock-db.js";

describe("Laboratory REST APIs, Billing Sync, RBAC & UU PDP (Task 25)", () => {
  it("GET /api/v1/laboratory/orders returns masked PII and cursor pagination metadata", async () => {
    const pool = new MockDatabasePool((sql) => {
      if (sql.includes("FROM lab_orders lo")) {
        return {
          rows: [
            {
              id: 25,
              order_number: "LAB-20261125-0001",
              examination_id: 69,
              registration_id: 135,
              status: "REQUESTED",
              clinical_notes: "Suspek anemia",
              ordered_at: new Date("2026-11-25T03:00:00Z"),
              completed_at: null,
              completed_by: null,
              patient_id: 1,
              patient_name: "Budi Santoso",
              medical_record_number: "RM-202611-00001",
              patient_nik: "3201011234560001",
              patient_phone: "081234567890",
              doctor_id: 1,
              doctor_name: "dr. Budi, Sp.PD",
              polyclinic_name: "Poli Penyakit Dalam",
              items: [
                {
                  id: 91,
                  test_name: "Hemoglobin (Hb)",
                  test_code: "HB01",
                  result_value: null,
                  reference_range: "13.0 - 17.0",
                  unit: "g/dL",
                  status_flag: null,
                  tariff: 45000,
                  notes: null,
                },
              ],
            },
          ],
        };
      }
      return { rows: [] };
    });

    const app = await buildApp({ config: createTestConfig(), pool });
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/laboratory/orders?status=REQUESTED&limit=1",
      });

      assert.equal(res.statusCode, 200);
      const body = res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.length, 1);
      assert.equal(body.data[0].patient_nik_masked, "320101**********");
      assert.equal(body.data[0].patient_phone_masked, "0812****7890");
      assert.equal((body.data[0] as any).patient_nik, undefined);
      assert.equal(body.data[0].items[0].tariff, 45000);
      assert.equal(body.meta.next_cursor, 25);
    } finally {
      await app.close();
    }
  });

  it("POST /api/v1/laboratory/orders creates order atomically, bulk-inserts items, syncs BPJS billing, and logs audit", async () => {
    let updatedBillingParams: unknown[] = [];
    let auditInserted = false;

    const pool = new MockDatabasePool((sql, params) => {
      if (sql.includes("FROM registrations r LEFT JOIN medical_examinations me")) {
        return {
          rows: [
            {
              registration_id: 136,
              registration_status: "IN_DOCTOR",
              examination_id: 70,
              examination_registration_id: 136,
            },
          ],
        };
      }
      if (sql.includes("pg_advisory_xact_lock")) {
        return { rows: [{ order_number: "LAB-20261125-0002" }] };
      }
      if (sql.startsWith("INSERT INTO lab_orders")) {
        return {
          rows: [
            {
              id: 50,
              order_number: "LAB-20261125-0002",
              status: "REQUESTED",
              ordered_at: "2026-11-25T04:00:00.000Z",
            },
          ],
        };
      }
      if (sql.startsWith("INSERT INTO lab_order_items")) {
        return {
          rows: [
            {
              id: 501,
              test_name: "Hemoglobin (Hb)",
              test_code: "HB01",
              result_value: null,
              reference_range: "13.0 - 17.0",
              unit: "g/dL",
              status_flag: null,
              tariff: 45000,
              notes: null,
            },
            {
              id: 502,
              test_name: "Glukosa Puasa",
              test_code: "GLU01",
              result_value: null,
              reference_range: "70 - 100",
              unit: "mg/dL",
              status_flag: null,
              tariff: 35000,
              notes: null,
            },
          ],
        };
      }
      if (sql.includes("FROM billings WHERE registration_id = $1 FOR UPDATE")) {
        return {
          rows: [
            {
              id: 10,
              insurance_type: "BPJS",
              total_registration_fee: 25000,
              total_actions_fee: 50000,
              total_medicines_fee: 0,
              payment_status: "UNPAID",
            },
          ],
        };
      }
      if (sql.includes("SUM(loi.tariff)")) {
        return { rows: [{ total_lab_fee: 80000 }] };
      }
      if (sql.startsWith("UPDATE billings SET total_lab_fee")) {
        updatedBillingParams = params;
        return { rowCount: 1, rows: [] };
      }
      if (sql.startsWith("INSERT INTO audit_logs")) {
        auditInserted = true;
        return { rowCount: 1, rows: [] };
      }
      return { rows: [] };
    });

    const app = await buildApp({ config: createTestConfig(), pool });
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/laboratory/orders",
        payload: {
          registration_id: 136,
          examination_id: 70,
          clinical_notes: "Evaluasi DM & Anemia",
          items: [
            { test_name: "Hemoglobin (Hb)", test_code: "HB01", tariff: 45000 },
            { test_name: "Glukosa Puasa", test_code: "GLU01", tariff: 35000 },
          ],
        },
      });

      assert.equal(res.statusCode, 201);
      const body = res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.order_number, "LAB-20261125-0002");
      assert.equal(body.data.total_tariff, 80000);
      assert.equal(pool.commits, 1);
      assert.equal(pool.releases, 1);
      assert.equal(auditInserted, true);
      // BPJS billing sync: total = 25k + 50k + 80k = 155k, covered_by_bpjs = 155k, patient_payable = 0
      assert.deepEqual(updatedBillingParams, [80000, 155000, 155000, 0, 10]);
    } finally {
      await app.close();
    }
  });

  it("POST /api/v1/laboratory/orders/:id/results supports frontend `items` payload and marks NORMAL/ABNORMAL", async () => {
    const pool = new MockDatabasePool((sql) => {
      if (sql.includes("FROM lab_orders WHERE id = $1 FOR UPDATE")) {
        return {
          rows: [
            {
              id: 50,
              order_number: "LAB-20261125-0002",
              examination_id: 70,
              registration_id: 136,
              status: "REQUESTED",
              clinical_notes: "Cek darah",
              completed_by: null,
            },
          ],
        };
      }
      if (sql.includes("FROM users WHERE id = $1")) {
        return { rows: [{ id: 6 }] };
      }
      if (sql.startsWith("UPDATE lab_order_items AS loi")) {
        return {
          rows: [
            {
              id: 501,
              test_name: "Hemoglobin (Hb)",
              test_code: "HB01",
              result_value: "14.2",
              reference_range: "13.0 - 17.0",
              unit: "g/dL",
              status_flag: "NORMAL",
              tariff: 45000,
              notes: "",
            },
            {
              id: 502,
              test_name: "Glukosa Puasa",
              test_code: "GLU01",
              result_value: "245",
              reference_range: "70 - 100",
              unit: "mg/dL",
              status_flag: "ABNORMAL",
              tariff: 35000,
              notes: "Hiperglikemia puasa",
            },
          ],
        };
      }
      return { rows: [] };
    });

    const app = await buildApp({ config: createTestConfig(), pool });
    try {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/laboratory/orders/50/results",
        payload: {
          completed_by: 6,
          items: [
            { id: 501, result_value: "14.2", status_flag: "NORMAL" },
            {
              id: 502,
              result_value: "245",
              status_flag: "ABNORMAL",
              notes: "Hiperglikemia puasa",
            },
          ],
        },
      });

      assert.equal(res.statusCode, 200);
      const body = res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.status, "COMPLETED");
      assert.equal(body.data.completed_by, 6);
      assert.equal(body.data.items[1].status_flag, "ABNORMAL");
      assert.equal(pool.commits, 1);
    } finally {
      await app.close();
    }
  });

  it("returns 422 inline field errors on invalid lab order payload and enforces 401/403 RBAC", async () => {
    const pool = new MockDatabasePool((sql, params) => {
      if (sql.includes("FROM users WHERE access_token = $1")) {
        if (params[0] === "cashier_valid_token") {
          return {
            rows: [
              { id: 7, username: "kasir", full_name: "Kasir", role: "cashier" },
            ],
          };
        }
        return { rows: [] };
      }
      return { rows: [] };
    });

    const app = await buildApp({ config: createTestConfig(), pool });
    try {
      // 1. 422 Inline field validation
      const validationRes = await app.inject({
        method: "POST",
        url: "/api/v1/laboratory/orders",
        payload: { registration_id: 0, items: [] },
      });
      assert.equal(validationRes.statusCode, 422);
      const valBody = validationRes.json();
      assert.equal(valBody.success, false);
      assert.ok(Array.isArray(valBody.errors.registration_id));
      assert.ok(Array.isArray(valBody.errors.items));

      // 2. 401 Invalid Bearer token
      const unauthRes = await app.inject({
        method: "GET",
        url: "/api/v1/laboratory/orders",
        headers: { authorization: "Bearer token_palsu" },
      });
      assert.equal(unauthRes.statusCode, 401);

      // 3. 403 Forbidden role (cashier cannot input lab results)
      const forbiddenRes = await app.inject({
        method: "POST",
        url: "/api/v1/laboratory/orders/50/results",
        headers: { authorization: "Bearer cashier_valid_token" },
        payload: { items: [{ id: 501, result_value: "12.0", status_flag: "NORMAL" }] },
      });
      assert.equal(forbiddenRes.statusCode, 403);
    } finally {
      await app.close();
    }
  });

  it("PATCH /api/v1/laboratory/orders/:id/status cancels pending order and recalculates billing, but blocks cancelling COMPLETED order", async () => {
    let currentStatus: "REQUESTED" | "COMPLETED" = "REQUESTED";
    let billingRecalculated = false;

    const pool = new MockDatabasePool((sql) => {
      if (sql.includes("FROM lab_orders WHERE id = $1 FOR UPDATE")) {
        return {
          rows: [
            {
              id: 60,
              order_number: "LAB-20261125-0009",
              examination_id: 70,
              registration_id: 136,
              status: currentStatus,
              clinical_notes: null,
              completed_by: null,
            },
          ],
        };
      }
      if (sql.includes("FROM billings WHERE registration_id = $1 FOR UPDATE")) {
        billingRecalculated = true;
        return {
          rows: [
            {
              id: 10,
              insurance_type: "GENERAL",
              total_registration_fee: 25000,
              total_actions_fee: 0,
              total_medicines_fee: 0,
              payment_status: "UNPAID",
            },
          ],
        };
      }
      if (sql.includes("SUM(loi.tariff)")) {
        return { rows: [{ total_lab_fee: 0 }] };
      }
      return { rows: [] };
    });

    const app = await buildApp({ config: createTestConfig(), pool });
    try {
      const cancelRes = await app.inject({
        method: "PATCH",
        url: "/api/v1/laboratory/orders/60/status",
        payload: { status: "CANCELLED", notes: "Pasien batal uji" },
      });
      assert.equal(cancelRes.statusCode, 200);
      assert.equal(billingRecalculated, true);

      currentStatus = "COMPLETED";
      const illegalCancelRes = await app.inject({
        method: "PATCH",
        url: "/api/v1/laboratory/orders/60/status",
        payload: { status: "CANCELLED" },
      });
      assert.equal(illegalCancelRes.statusCode, 409);
      assert.equal(pool.rollbacks, 1);
    } finally {
      await app.close();
    }
  });
});
