import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { createDatabasePool, type DatabasePool } from "./config/db.js";
import { env as defaultEnv, type AppEnv } from "./config/env.js";
import { AnalyticsController } from "./controllers/analytics.js";
import { HealthController } from "./controllers/health.js";
import { LaboratoryController } from "./controllers/laboratory.js";
import { registerErrorHandlers } from "./errors/error-handler.js";
import { registerRateLimiter } from "./plugins/rate-limit.js";
import { AnalyticsRepository } from "./repositories/analytics.repository.js";
import { AuditRepository } from "./repositories/audit.repository.js";
import { AuthRepository } from "./repositories/auth.repository.js";
import { LaboratoryRepository } from "./repositories/laboratory.repository.js";
import { registerAnalyticsRoutes } from "./routes/analytics.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerLaboratoryRoutes } from "./routes/laboratory.js";
import { AnalyticsService } from "./services/analytics.service.js";
import { LaboratoryService } from "./services/laboratory.service.js";

export interface BuildAppOptions {
  config?: AppEnv;
  pool?: DatabasePool;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? defaultEnv;
  const fastify = Fastify({
    logger: options.logger ?? config.NODE_ENV !== "test",
    bodyLimit: 1_048_576, // 1 MiB payload ceiling
    requestTimeout: 30_000,
    trustProxy: true,
  });

  const ownsPool = !options.pool;
  const pool =
    options.pool ??
    createDatabasePool(config, (err) => {
      fastify.log.error({ err }, "Unexpected PostgreSQL idle pool client error");
    });

  if (ownsPool) {
    fastify.addHook("onClose", async () => {
      await pool.end();
    });
  }

  const corsOrigin =
    config.CORS_ORIGIN === "*"
      ? true
      : config.CORS_ORIGIN.split(",").map((origin) => origin.trim());

  await fastify.register(cors, {
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization"],
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });

  fastify.decorateRequest("user", null);

  registerRateLimiter(fastify, {
    max: config.RATE_LIMIT_MAX,
    windowMs: config.RATE_LIMIT_WINDOW_MS,
  });

  registerErrorHandlers(fastify);

  // Dependency wiring (Repository -> Service -> Controller -> Route)
  const authRepo = new AuthRepository(pool);
  const auditRepo = new AuditRepository(pool);
  const labRepo = new LaboratoryRepository(pool);
  const analyticsRepo = new AnalyticsRepository(pool);

  const labService = new LaboratoryService(pool, labRepo, authRepo, auditRepo);
  const analyticsService = new AnalyticsService(analyticsRepo);

  const healthController = new HealthController(pool);
  const labController = new LaboratoryController(labService);
  const analyticsController = new AnalyticsController(analyticsService);

  const authOptions = {
    authRepo,
    authRequired: config.AUTH_REQUIRED,
  };

  registerHealthRoutes(fastify, healthController);
  registerLaboratoryRoutes(fastify, labController, authOptions);
  registerAnalyticsRoutes(fastify, analyticsController, authOptions);

  return fastify;
}
