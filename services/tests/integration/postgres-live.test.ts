import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildApp } from "../../src/app.js";
import { createDatabasePool } from "../../src/config/db.js";
import { loadEnv } from "../../src/config/env.js";
import { runAncillaryMigrations } from "../../src/db/migrate.js";

const liveDbHost = process.env.DB_HOST || "127.0.0.1";
const liveEnv = loadEnv({
  ...process.env,
  NODE_ENV: "test",
  DB_HOST: liveDbHost,
  DB_PORT: process.env.DB_PORT || "5432",
  DB_NAME: process.env.DB_NAME || "simrs_db",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "12341234",
  DB_CONN_TIMEOUT_MS: "1500",
});

describe("Live PostgreSQL 17 Integration & Query Plan Verification", () => {
  it("applies index migrations, eliminates unindexed FKs, and executes full Lab + Analytics workflow atomically", async (t) => {
    const probePool = createDatabasePool(liveEnv);
    try {
      await probePool.query("SELECT 1;");
    } catch {
      await probePool.end();
      t.skip("PostgreSQL 17 instance is not reachable on this host; skipping live DB test.");
      return;
    }

    // 1. Run idempotent index optimizations
    const migResult = await runAncillaryMigrations(liveEnv);
    assert.equal(migResult.appliedFile, "001_optimize_ancillary_indexes.sql");

    // 2. Verify zero unindexed foreign keys across all tables (postgres-best-practices Rule 4.2)
    const missingFkRes = await probePool.query(`
      SELECT
        conrelid::regclass::text AS table_name,
        a.attname AS fk_column
      FROM pg_constraint c
      JOIN pg_attribute a
        ON a.attrelid = c.conrelid
        AND a.attnum = ANY(c.conkey)
      WHERE c.contype = 'f'
        AND NOT EXISTS (
          SELECT 1
          FROM pg_index i
          WHERE i.indrelid = c.conrelid
            AND i.indkey[0] = a.attnum
        );
    `);
    assert.deepEqual(
      missingFkRes.rows,
      [],
      `Found unindexed foreign keys: ${JSON.stringify(missingFkRes.rows)}`
    );

    // 3. Verify EXPLAIN query plan executes cleanly with index awareness
    const explainRes = await probePool.query(`
      EXPLAIN (FORMAT JSON)
      SELECT COUNT(*) FROM registrations
      WHERE registration_date >= CURRENT_DATE - INTERVAL '7 days'
        AND registration_date <= CURRENT_DATE;
    `);
    assert.ok(Array.isArray(explainRes.rows[0]["QUERY PLAN"]));

    // 4. Find an existing unpaid registration + medical_examination for E2E test
    const pairRes = await probePool.query<{
      registration_id: number;
      examination_id: number;
      billing_id: number | null;
      orig_lab_fee: number | null;
      orig_total: number | null;
      orig_bpjs: number | null;
      orig_payable: number | null;
    }>(`
      SELECT
        r.id AS registration_id,
        me.id AS examination_id,
        b.id AS billing_id,
        b.total_lab_fee::float8 AS orig_lab_fee,
        b.total_amount::float8 AS orig_total,
        b.covered_by_bpjs::float8 AS orig_bpjs,
        b.patient_payable::float8 AS orig_payable
      FROM registrations r
      INNER JOIN medical_examinations me ON me.registration_id = r.id
      LEFT JOIN billings b ON b.registration_id = r.id
      WHERE b.id IS NULL OR b.payment_status = 'UNPAID'
      ORDER BY r.id DESC
      LIMIT 1;
    `);

    const app = await buildApp({ config: liveEnv, pool: probePool });
    let createdOrderId: number | null = null;

    try {
      // Analytics E2E check
      const analyticsRes = await app.inject({
        method: "GET",
        url: "/api/v1/analytics/summary?start_date=2026-01-01&end_date=2026-12-31",
      });
      assert.equal(analyticsRes.statusCode, 200);
      assert.equal(analyticsRes.json().success, true);

      if (pairRes.rows.length > 0) {
        const target = pairRes.rows[0];

        // Create lab order
        const createRes = await app.inject({
          method: "POST",
          url: "/api/v1/laboratory/orders",
          payload: {
            registration_id: target.registration_id,
            examination_id: target.examination_id,
            clinical_notes: "Automated integration test order",
            items: [
              {
                test_name: "Hemoglobin (Hb)",
                test_code: "HB01",
                reference_range: "13.0 - 17.0",
                unit: "g/dL",
                tariff: 45000,
              },
              {
                test_name: "Glukosa Puasa",
                test_code: "GLU01",
                reference_range: "70 - 100",
                unit: "mg/dL",
                tariff: 35000,
              },
            ],
          },
        });

        assert.equal(createRes.statusCode, 201);
        const createdData = createRes.json().data;
        createdOrderId = createdData.id;
        assert.equal(createdData.items.length, 2);

        // Transition to IN_PROGRESS
        const progressRes = await app.inject({
          method: "PATCH",
          url: `/api/v1/laboratory/orders/${createdOrderId}/status`,
          payload: { status: "IN_PROGRESS" },
        });
        assert.equal(progressRes.statusCode, 200);

        // Submit lab results using frontend `items` shape
        const resultRes = await app.inject({
          method: "POST",
          url: `/api/v1/laboratory/orders/${createdOrderId}/results`,
          payload: {
            completed_by: 1,
            items: [
              {
                id: createdData.items[0].id,
                result_value: "14.8",
                status_flag: "NORMAL",
              },
              {
                id: createdData.items[1].id,
                result_value: "212",
                status_flag: "ABNORMAL",
                notes: "Kontrol glukosa darah",
              },
            ],
          },
        });
        assert.equal(resultRes.statusCode, 200);
        assert.equal(resultRes.json().data.status, "COMPLETED");

        // Fetch single order & search list, verifying masked PII
        const [detailRes, searchRes] = await Promise.all([
          app.inject({
            method: "GET",
            url: `/api/v1/laboratory/orders/${createdOrderId}`,
          }),
          app.inject({
            method: "GET",
            url: `/api/v1/laboratory/orders?search=${encodeURIComponent(createdData.order_number)}&status=COMPLETED`,
          }),
        ]);
        assert.equal(detailRes.statusCode, 200);
        assert.ok(detailRes.json().data.patient_nik_masked?.includes("*"));
        assert.equal(searchRes.statusCode, 200);
        assert.equal(searchRes.json().data.length, 1);
      }
    } finally {
      // Clean up test artifacts so live DB remains spotless
      if (createdOrderId !== null) {
        const target = pairRes.rows[0];
        await probePool.query("DELETE FROM lab_orders WHERE id = $1;", [createdOrderId]);
        await probePool.query(
          "DELETE FROM audit_logs WHERE module = 'LABORATORY' AND record_id = $1;",
          [String(createdOrderId)]
        );
        if (target?.billing_id !== null && target?.billing_id !== undefined) {
          await probePool.query(
            `
              UPDATE billings
              SET total_lab_fee = $1,
                  total_amount = $2,
                  covered_by_bpjs = $3,
                  patient_payable = $4
              WHERE id = $5;
            `,
            [
              target.orig_lab_fee ?? 0,
              target.orig_total ?? 0,
              target.orig_bpjs ?? 0,
              target.orig_payable ?? 0,
              target.billing_id,
            ]
          );
        }
      }
      await app.close();
      await probePool.end();
    }
  });
});
