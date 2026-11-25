import { z } from "zod";

const booleanStringSchema = z
  .enum(["true", "false", "1", "0"])
  .transform((val) => val === "true" || val === "1");

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    HOST: z.string().min(1).default("0.0.0.0"),
    DB_HOST: z.string().min(1).default("postgres"),
    DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
    DB_NAME: z.string().min(1).default("simrs_db"),
    DB_USER: z.string().min(1).default("postgres"),
    DB_PASSWORD: z.string().default("12341234"),
    DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(20),
    DB_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),
    DB_CONN_TIMEOUT_MS: z.coerce.number().int().min(500).default(5000),
    DB_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(1000).default(15000),
    CORS_ORIGIN: z.string().default("*"),
    AUTH_REQUIRED: booleanStringSchema.optional(),
    RATE_LIMIT_MAX: z.coerce.number().int().min(10).default(300),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60000),
  })
  .transform((cfg) => ({
    ...cfg,
    AUTH_REQUIRED: cfg.AUTH_REQUIRED ?? cfg.NODE_ENV === "production",
  }));

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Konfigurasi environment tidak valid: ${formatted}`);
  }
  return parsed.data;
}

export const env: AppEnv = loadEnv();
