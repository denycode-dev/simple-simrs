import type { FastifyInstance } from "fastify";
import type { LaboratoryController } from "../controllers/laboratory.js";
import { createRoleGuard, type AuthGuardOptions } from "../plugins/auth.js";

export function registerLaboratoryRoutes(
  fastify: FastifyInstance,
  controller: LaboratoryController,
  authOptions: AuthGuardOptions
): void {
  const canReadLab = createRoleGuard(authOptions, [
    "admin",
    "doctor",
    "lab",
    "nurse",
    "cashier",
    "registration",
  ]);
  const canCreateLabOrder = createRoleGuard(authOptions, [
    "admin",
    "doctor",
    "lab",
  ]);
  const canManageLabResults = createRoleGuard(authOptions, ["admin", "lab"]);

  fastify.get(
    "/api/v1/laboratory/orders",
    { preHandler: canReadLab },
    controller.listOrders
  );

  fastify.get(
    "/api/v1/laboratory/orders/:id",
    { preHandler: canReadLab },
    controller.getOrderById
  );

  fastify.post(
    "/api/v1/laboratory/orders",
    { preHandler: canCreateLabOrder },
    controller.createOrder
  );

  fastify.post(
    "/api/v1/laboratory/orders/:id/results",
    { preHandler: canManageLabResults },
    controller.submitResults
  );

  fastify.put(
    "/api/v1/laboratory/orders/:id/results",
    { preHandler: canManageLabResults },
    controller.submitResults
  );

  fastify.patch(
    "/api/v1/laboratory/orders/:id/status",
    { preHandler: canManageLabResults },
    controller.updateStatus
  );
}
