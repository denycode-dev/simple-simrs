/**
 * Sanitizes audit log payloads so credentials, tokens, or secrets
 * are never persisted in plaintext (UU PDP & ISO 27001 compliance).
 */

export const REDACTED_KEYS = new Set([
  "password",
  "password_hash",
  "auth_key",
  "access_token",
  "token",
  "secret",
  "authorization",
  "refresh_token",
]);

export function sanitizeAuditData(input: unknown): unknown {
  if (input === null || input === undefined) {
    return null;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeAuditData(item));
  }

  if (typeof input === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (REDACTED_KEYS.has(key.toLowerCase())) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = sanitizeAuditData(value);
      }
    }
    return result;
  }

  return input;
}

export function serializeSanitizedJson(input: unknown): string | null {
  if (input === null || input === undefined) {
    return null;
  }
  return JSON.stringify(sanitizeAuditData(input));
}
