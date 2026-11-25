import type { QueryResult, QueryResultRow } from "pg";
import type { DatabasePool, TransactionalClient } from "../../src/config/db.js";
import type { AppEnv } from "../../src/config/env.js";

export interface RecordedQuery {
  sql: string;
  params: unknown[];
}

export type MockQueryResolver = (
  sql: string,
  params: unknown[]
) => Promise<Partial<QueryResult<any>>> | Partial<QueryResult<any>>;

export class MockDatabasePool implements DatabasePool {
  public readonly queries: RecordedQuery[] = [];
  public commits = 0;
  public rollbacks = 0;
  public releases = 0;
  public ended = false;

  constructor(private resolver: MockQueryResolver) {}

  setResolver(resolver: MockQueryResolver): void {
    this.resolver = resolver;
  }

  async query<R extends QueryResultRow = any>(
    text: string,
    values: unknown[] = []
  ): Promise<QueryResult<R>> {
    const normalizedSql = text.replace(/\s+/g, " ").trim();
    this.queries.push({ sql: normalizedSql, params: values });

    if (normalizedSql === "BEGIN") {
      return this.emptyResult();
    }
    if (normalizedSql === "COMMIT") {
      this.commits += 1;
      return this.emptyResult();
    }
    if (normalizedSql === "ROLLBACK") {
      this.rollbacks += 1;
      return this.emptyResult();
    }
    if (normalizedSql.startsWith("SET LOCAL ")) {
      return this.emptyResult();
    }

    const res = await this.resolver(normalizedSql, values);
    const rows = (res.rows ?? []) as R[];
    return {
      command: res.command ?? "SELECT",
      rowCount: res.rowCount ?? rows.length,
      oid: 0,
      fields: [],
      rows,
    };
  }

  async connect(): Promise<TransactionalClient> {
    return {
      query: this.query.bind(this),
      release: () => {
        this.releases += 1;
      },
    };
  }

  async end(): Promise<void> {
    this.ended = true;
  }

  private emptyResult<R extends QueryResultRow>(): QueryResult<R> {
    return {
      command: "SQL",
      rowCount: 0,
      oid: 0,
      fields: [],
      rows: [],
    };
  }
}

export function createTestConfig(overrides: Partial<AppEnv> = {}): AppEnv {
  return {
    NODE_ENV: "test",
    PORT: 4000,
    HOST: "127.0.0.1",
    DB_HOST: "127.0.0.1",
    DB_PORT: 5432,
    DB_NAME: "simrs_db",
    DB_USER: "postgres",
    DB_PASSWORD: "secret",
    DB_POOL_MAX: 5,
    DB_IDLE_TIMEOUT_MS: 10000,
    DB_CONN_TIMEOUT_MS: 2000,
    DB_STATEMENT_TIMEOUT_MS: 5000,
    CORS_ORIGIN: "*",
    AUTH_REQUIRED: false,
    RATE_LIMIT_MAX: 500,
    RATE_LIMIT_WINDOW_MS: 60000,
    ...overrides,
  };
}
