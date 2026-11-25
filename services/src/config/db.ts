import pg from "pg";
import type { PoolConfig, QueryResult, QueryResultRow } from "pg";
import type { AppEnv } from "./env.js";

const { Pool } = pg;

export interface QueryExecutor {
  query<R extends QueryResultRow = any>(
    text: string,
    values?: unknown[]
  ): Promise<QueryResult<R>>;
}

export interface TransactionalClient extends QueryExecutor {
  release(err?: Error | boolean): void;
}

export interface DatabasePool extends QueryExecutor {
  connect(): Promise<TransactionalClient>;
  end(): Promise<void>;
}

/**
 * Creates a PostgreSQL 17 connection pool configured per postgres-best-practices:
 * - Bounded pool size (`max`) to prevent backend memory exhaustion
 * - Automatic reclamation of idle & idle-in-transaction sessions
 * - Statement timeout guard to prevent runaway queries
 * - Uses unnamed prepared statements by default for PgBouncer transaction-mode compatibility
 */
export function createDatabasePool(
  config: AppEnv,
  onError?: (err: Error) => void
): DatabasePool {
  const poolConfig: PoolConfig = {
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    max: config.DB_POOL_MAX,
    idleTimeoutMillis: config.DB_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: config.DB_CONN_TIMEOUT_MS,
    statement_timeout: config.DB_STATEMENT_TIMEOUT_MS,
    idle_in_transaction_session_timeout: config.DB_STATEMENT_TIMEOUT_MS,
    application_name: "simrs-ancillary-service",
  };

  const pool = new Pool(poolConfig);

  pool.on("error", (err) => {
    if (onError) {
      onError(err);
    }
  });

  return pool;
}

/**
 * Executes a short ACID transaction with lock_timeout and statement_timeout guards,
 * guaranteeing ROLLBACK on failure and connection release back to the pool.
 */
export async function withTransaction<T>(
  pool: DatabasePool,
  operation: (client: QueryExecutor) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '15s'");

    const result = await operation(client);

    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback secondary error if connection dropped
    }
    throw err;
  } finally {
    client.release();
  }
}
