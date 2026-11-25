import type { FastifyInstance } from "fastify";
import type { AnalyticsController } from "../controllers/analytics.js";
import { createRoleGuard, type AuthGuardOptions } from "../plugins/auth.js";

export function registerAnalyticsRoutes(
  fastify: FastifyInstance,
  controller: AnalyticsController,
  authOptions: AuthGuardOptions
): void {
  // Per SIMRS RBAC Matrix (SPECIFICATION.md Section 3):
  // Dashboard & Laporan accessible to admin, registration, doctor, pharmacist, lab, cashier
  const canReadAnalytics = createRoleGuard(authOptions, [
    "admin",
    "registration",
    "doctor",
    "pharmacist",
    "lab",
    "cashier",
  ]);

  fastify.get(
    "/api/v1/analytics/summary",
    { preHandler: canReadAnalytics },
    controller.getSummary
  );

  fastify.get(
    "/api/v1/analytics/queue-status",
    { preHandler: canReadAnalytics },
    controller.getQueueStatus
  );

  fastify.get(
    "/api/v1/analytics/laboratory",
    { preHandler: canReadAnalytics },
    controller.getLaboratorySummary
  );

  fastify.get(
    "/api/v1/analytics/pharmacy",
    { preHandler: canReadAnalytics },
    controller.getPharmacySummary
  );
}
