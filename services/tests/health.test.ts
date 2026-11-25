import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildApp } from "../src/app.js";
import { createTestConfig, MockDatabasePool } from "./helpers/mock-db.js";

describe("Health & Gateway Diagnostics (Task 23)", () => {
  it("GET /health returns 200 OK with service metadata", async () => {
    const pool = new MockDatabasePool(() => ({ rows: [] }));
    const app = await buildApp({ config: createTestConfig(), pool });

    try {
      const response = await app.inject({
        method: "GET",
        url: "/health",
      });

      assert.equal(response.statusCode, 200);
      const body = response.json();
      assert.equal(body.status, "ok");
      assert.equal(body.service, "ancillary-service");
      assert.equal(typeof body.timestamp, "string");
      assert.equal(response.headers["x-content-type-options"], "nosniff");
    } finally {
      await app.close();
    }
  });

  it("GET /health/ready and /api/v1/health return 200 when PostgreSQL is reachable", async () => {
    const pool = new MockDatabasePool(() => ({ rows: [{ "?column?": 1 }] }));
    const app = await buildApp({ config: createTestConfig(), pool });

    try {
      const [readyRes, apiHealthRes] = await Promise.all([
        app.inject({ method: "GET", url: "/health/ready" }),
        app.inject({ method: "GET", url: "/api/v1/health" }),
      ]);

      assert.equal(readyRes.statusCode, 200);
      assert.equal(readyRes.json().status, "ready");
      assert.equal(readyRes.json().database, "connected");
      assert.equal(apiHealthRes.statusCode, 200);
    } finally {
      await app.close();
    }
  });

  it("GET /health/ready returns 503 Service Unavailable when PostgreSQL fails", async () => {
    const pool = new MockDatabasePool(() => {
      throw new Error("ECONNREFUSED 127.0.0.1:5432");
    });
    const app = await buildApp({ config: createTestConfig(), pool });

    try {
      const res = await app.inject({ method: "GET", url: "/health/ready" });
      assert.equal(res.statusCode, 503);
      const body = res.json();
      assert.equal(body.success, false);
      assert.ok(!body.message.includes("ECONNREFUSED"));
    } finally {
      await app.close();
    }
  });

  it("handles CORS preflight OPTIONS and returns 404 Indonesian JSON for unknown routes", async () => {
    const pool = new MockDatabasePool(() => ({ rows: [] }));
    const app = await buildApp({ config: createTestConfig(), pool });

    try {
      const optionsRes = await app.inject({
        method: "OPTIONS",
        url: "/api/v1/laboratory/orders",
        headers: {
          origin: "http://localhost:5173",
          "access-control-request-method": "POST",
          "access-control-request-headers": "Authorization, Content-Type",
        },
      });
      assert.ok([200, 204].includes(optionsRes.statusCode));
      assert.equal(optionsRes.headers["access-control-allow-origin"], "http://localhost:5173");

      const notFoundRes = await app.inject({
        method: "GET",
        url: "/api/v1/unknown-endpoint",
      });
      assert.equal(notFoundRes.statusCode, 404);
      assert.equal(notFoundRes.json().success, false);
    } finally {
      await app.close();
    }
  });
});
