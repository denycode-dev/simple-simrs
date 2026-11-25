import type { FastifyInstance } from "fastify";
import type { HealthController } from "../controllers/health.js";

export function registerHealthRoutes(
  fastify: FastifyInstance,
  controller: HealthController
): void {
  fastify.get("/health", controller.getLiveness);
  fastify.get("/health/ready", controller.getReadiness);
  fastify.get("/api/v1/health", controller.getReadiness);
}
