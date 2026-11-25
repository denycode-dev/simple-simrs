import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabasePool } from "../config/db.js";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runAncillaryMigrations(
  customDbEnv = env
): Promise<{ appliedFile: string }> {
  const pool = createDatabasePool(customDbEnv);
  const sqlFile = path.join(__dirname, "migrations", "001_optimize_ancillary_indexes.sql");

  try {
    const sql = await readFile(sqlFile, "utf8");
    await pool.query(sql);
    return { appliedFile: "001_optimize_ancillary_indexes.sql" };
  } finally {
    await pool.end();
  }
}

const isMainModule =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  runAncillaryMigrations()
    .then(({ appliedFile }) => {
      console.log(`[db:migrate] Successfully applied ${appliedFile}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("[db:migrate] Failed to apply database optimizations:", err);
      process.exit(1);
    });
}
