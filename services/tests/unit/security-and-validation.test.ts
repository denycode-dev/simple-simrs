import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildApp } from "../../src/app.js";
import { loadEnv } from "../../src/config/env.js";
import { analyticsDateRangeQuerySchema } from "../../src/schemas/analytics.schema.js";
import { submitLabResultsBodySchema } from "../../src/schemas/laboratory.schema.js";
import {
  maskAddress,
  maskBpjsNumber,
  maskEmail,
  maskNik,
  maskPhone,
} from "../../src/utils/masking.js";
import { sanitizeAuditData } from "../../src/utils/sanitization.js";
import { createTestConfig, MockDatabasePool } from "../helpers/mock-db.js";

describe("UU PDP Privacy Masking & Audit Sanitization", () => {
  it("masks NIK, phone, BPJS, email, and address by default", () => {
    assert.equal(maskNik("3201011234560001"), "320101**********");
    assert.equal(maskPhone("081234567890"), "0812****7890");
    assert.equal(maskBpjsNumber("0001234567890"), "0001*****7890");
    assert.equal(maskEmail("budi.santoso@gmail.com"), "b***@gmail.com");
    assert.equal(
      maskAddress("Jl. Pajajaran No. 45 RT 02/05"),
      "Jl. Pajajaran No. **"
    );
    assert.equal(maskNik(null), null);
  });

  it("redacts sensitive credentials recursively in audit payloads", () => {
    const raw = {
      username: "lab",
      password: "plain_password",
      nested: {
        access_token: "secret_jwt_123",
        Password_Hash: "$2y$10$abcdef",
        Authorization: "Bearer xyz",
        safe_field: "NORMAL",
      },
    };

    const sanitized = sanitizeAuditData(raw) as any;
    assert.equal(sanitized.username, "lab");
    assert.equal(sanitized.password, "[REDACTED]");
    assert.equal(sanitized.nested.access_token, "[REDACTED]");
    assert.equal(sanitized.nested.Password_Hash, "[REDACTED]");
    assert.equal(sanitized.nested.Authorization, "[REDACTED]");
    assert.equal(sanitized.nested.safe_field, "NORMAL");
  });
});

describe("Environment, Schema Boundary Validation & Security Guards", () => {
  it("validates startup environment variables and defaults AUTH_REQUIRED=true in production", () => {
    const devCfg = loadEnv({ NODE_ENV: "development", PORT: "4000" });
    assert.equal(devCfg.AUTH_REQUIRED, false);

    const prodCfg = loadEnv({ NODE_ENV: "production", PORT: "4000" });
    assert.equal(prodCfg.AUTH_REQUIRED, true);

    assert.throws(() => loadEnv({ PORT: "99999" }), /Konfigurasi environment tidak valid/);
  });

  it("normalizes both frontend `items` and API `results` payloads in submitLabResultsBodySchema", () => {
    const fromFrontend = submitLabResultsBodySchema.parse({
      completed_by: 6,
      items: [
        { id: 101, result_value: "14.5", status_flag: "NORMAL", unit: "g/dL" },
      ],
    });
    assert.equal(fromFrontend.completed_by, 6);
    assert.equal(fromFrontend.entries[0].item_id, 101);

    const fromApi = submitLabResultsBodySchema.parse({
      results: [
        { item_id: 102, result_value: 250, status_flag: "ABNORMAL" },
      ],
    });
    assert.equal(fromApi.entries[0].item_id, 102);
    assert.equal(fromApi.entries[0].result_value, "250");
  });

  it("rejects reversed date ranges and invalid calendar dates in analyticsDateRangeQuerySchema", () => {
    const badRange = analyticsDateRangeQuerySchema.safeParse({
      start_date: "2026-11-25",
      end_date: "2026-11-20",
    });
    assert.equal(badRange.success, false);

    const invalidDate = analyticsDateRangeQuerySchema.safeParse({
      start_date: "2026-02-30",
    });
    assert.equal(invalidDate.success, false);
  });

  it("never leaks internal SQL details on 500 errors and enforces rate limiting (429)", async () => {
    const pool = new MockDatabasePool(() => {
      throw new Error('SELECT * FROM secret_table WHERE password = "abc" failed');
    });
    const app = await buildApp({
      config: createTestConfig({ RATE_LIMIT_MAX: 10, RATE_LIMIT_WINDOW_MS: 60_000 }),
      pool,
    });

    try {
      const errRes = await app.inject({
        method: "GET",
        url: "/api/v1/laboratory/orders",
      });
      assert.equal(errRes.statusCode, 500);
      assert.equal(errRes.json().success, false);
      assert.ok(!errRes.json().message.includes("secret_table"));

      const malformedRes = await app.inject({
        method: "POST",
        url: "/api/v1/laboratory/orders",
        headers: { "content-type": "application/json" },
        payload: "{ broken json",
      });
      assert.equal(malformedRes.statusCode, 400);

      // Exhaust remaining rate limit budget (already used 2 above, max = 10)
      let lastStatus = 200;
      for (let i = 0; i < 10; i += 1) {
        const res = await app.inject({
          method: "GET",
          url: "/api/v1/unknown",
        });
        lastStatus = res.statusCode;
      }
      assert.equal(lastStatus, 429);
    } finally {
      await app.close();
    }
  });
});
