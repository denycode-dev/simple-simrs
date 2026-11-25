import type { QueryExecutor } from "../config/db.js";
import { serializeSanitizedJson } from "../utils/sanitization.js";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "UNMASK_DATA"
  | "DISPENSE"
  | "PAYMENT";

export type AuditModule =
  | "AUTH"
  | "PATIENTS"
  | "REGISTRATIONS"
  | "NURSE_ASSESSMENT"
  | "EXAMINATIONS"
  | "PHARMACY"
  | "LABORATORY"
  | "BILLING"
  | "USERS";

export interface CreateAuditLogInput {
  userId?: number | null;
  action: AuditAction;
  module: AuditModule;
  recordId?: string | number | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  details?: Record<string, unknown> | string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Append-only audit repository matching `audit_logs` schema & Yii2 AuditLog model.
 * Intentionally exposes ONLY `insert` (no update or delete methods) for immutability.
 */
export class AuditRepository {
  constructor(private readonly db: QueryExecutor) {}

  async insert(entry: CreateAuditLogInput, client?: QueryExecutor): Promise<void> {
    const executor = client ?? this.db;

    const recordId =
      entry.recordId !== null && entry.recordId !== undefined
        ? String(entry.recordId).slice(0, 50)
        : null;
    const ipAddress = (entry.ipAddress || "127.0.0.1").slice(0, 45);
    const userAgent = (entry.userAgent || "SIMRS-Ancillary-Service").slice(0, 255);
    const oldValues = entry.oldValues ? serializeSanitizedJson(entry.oldValues) : null;
    const newValues = entry.newValues ? serializeSanitizedJson(entry.newValues) : null;
    const details =
      typeof entry.details === "string"
        ? entry.details
        : entry.details
          ? serializeSanitizedJson(entry.details)
          : null;

    const sql = `
      INSERT INTO audit_logs (
        user_id,
        action,
        module,
        record_id,
        old_values,
        new_values,
        details,
        ip_address,
        user_agent,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP);
    `;

    await executor.query(sql, [
      entry.userId ?? null,
      entry.action.slice(0, 50),
      entry.module.slice(0, 50),
      recordId,
      oldValues,
      newValues,
      details,
      ipAddress,
      userAgent,
    ]);
  }
}
