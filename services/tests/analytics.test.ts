import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildApp } from "../src/app.js";
import { createTestConfig, MockDatabasePool } from "./helpers/mock-db.js";

describe("Analytics Aggregation REST APIs (Task 30)", () => {
  it("GET /api/v1/analytics/summary filters all 4 metrics by start_date & end_date in parallel", async () => {
    const pool = new MockDatabasePool((sql) => {
      if (sql.includes("COUNT(*)::int AS total_visits")) {
        return {
          rows: [
            {
              total_visits: 12,
              general_visits: 5,
              bpjs_visits: 7,
              completed_visits: 9,
            },
          ],
        };
      }
      if (sql.includes("AS total_revenue")) {
        return {
          rows: [
            {
              total_revenue: 1_850_000,
              general_revenue: 750_000,
              bpjs_covered_revenue: 1_100_000,
            },
          ],
        };
      }
      if (sql.includes("AS polyclinic_name")) {
        return {
          rows: [
            { polyclinic_name: "Poli Penyakit Dalam", visit_count: 7 },
            { polyclinic_name: "Poli Umum", visit_count: 5 },
          ],
        };
      }
      if (sql.includes("WITH prescribed_totals")) {
        return {
          rows: [
            { medicine_name: "Amlodipine 5mg", unit: "Tablet", total_prescribed: 60 },
          ],
        };
      }
      return { rows: [] };
    });

    const app = await buildApp({ config: createTestConfig(), pool });
    try {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/summary?start_date=2026-11-01&end_date=2026-11-25",
      });

      assert.equal(res.statusCode, 200);
      const body = res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.period.start_date, "2026-11-01");
      assert.equal(body.data.period.end_date, "2026-11-25");
      assert.equal(body.data.visits.total_visits, 12);
      assert.equal(body.data.revenue.total_revenue, 1_850_000);
      assert.equal(body.data.revenue.bpjs_covered_revenue, 1_100_000);
      assert.equal(body.data.polyclinics.length, 2);
      assert.equal(body.data.top_medicines[0].medicine_name, "Amlodipine 5mg");

      // Ensure every SQL query used exact date parameters (including revenue & medicines!)
      for (const q of pool.queries) {
        assert.ok(
          q.params.includes("2026-11-01") && q.params.includes("2026-11-25"),
          `Expected date range params in query: ${q.sql}`
        );
      }
    } finally {
      await app.close();
    }
  });

  it("supports queue-status, laboratory, and pharmacy analytics endpoints and enforces RBAC", async () => {
    const pool = new MockDatabasePool((sql, params) => {
      if (sql.includes("FROM users WHERE access_token = $1")) {
        if (params[0] === "nurse_token_001") {
          return {
            rows: [{ id: 3, username: "perawat", full_name: "Ners", role: "nurse" }],
          };
        }
        if (params[0] === "admin_token_001") {
          return {
            rows: [{ id: 1, username: "admin", full_name: "Admin", role: "admin" }],
          };
        }
      }
      if (sql.includes("GROUP BY status")) {
        return {
          rows: [
            { status: "WAITING_DOCTOR", count: 3 },
            { status: "COMPLETED", count: 8 },
          ],
        };
      }
      if (sql.includes("AS requested_orders")) {
        return {
          rows: [
            {
              total_orders: 4,
              requested_orders: 1,
              in_progress_orders: 1,
              completed_orders: 2,
              cancelled_orders: 0,
            },
          ],
        };
      }
      if (sql.includes("AS abnormal_items")) {
        return {
          rows: [{ total_test_items: 8, abnormal_items: 2, total_lab_tariff: 360000 }],
        };
      }
      if (sql.includes("AS total_active_medicines")) {
        return {
          rows: [{ total_active_medicines: 10, low_stock_count: 1, out_of_stock_count: 0 }],
        };
      }
      if (sql.includes("AS pending_prescriptions")) {
        return {
          rows: [{ pending_prescriptions: 2, dispensed_prescriptions: 6 }],
        };
      }
      return { rows: [] };
    });

    const app = await buildApp({ config: createTestConfig({ AUTH_REQUIRED: true }), pool });
    try {
      // Nurse role is not granted Dashboard Analytics in RBAC Matrix -> 403
      const nurseRes = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/summary",
        headers: { authorization: "Bearer nurse_token_001" },
      });
      assert.equal(nurseRes.statusCode, 403);

      const authHeaders = { authorization: "Bearer admin_token_001" };
      const [queueRes, labRes, pharmaRes] = await Promise.all([
        app.inject({ method: "GET", url: "/api/v1/analytics/queue-status", headers: authHeaders }),
        app.inject({ method: "GET", url: "/api/v1/analytics/laboratory", headers: authHeaders }),
        app.inject({ method: "GET", url: "/api/v1/analytics/pharmacy", headers: authHeaders }),
      ]);

      assert.equal(queueRes.statusCode, 200);
      assert.equal(queueRes.json().data.total_active_queue, 3);
      assert.equal(labRes.statusCode, 200);
      assert.equal(labRes.json().data.abnormal_items, 2);
      assert.equal(pharmaRes.statusCode, 200);
      assert.equal(pharmaRes.json().data.dispensed_prescriptions, 6);
    } finally {
      await app.close();
    }
  });
});
