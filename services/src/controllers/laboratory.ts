import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createLabOrderBodySchema,
  listLabOrdersQuerySchema,
  orderIdParamSchema,
  submitLabResultsBodySchema,
  updateLabOrderStatusBodySchema,
} from "../schemas/laboratory.schema.js";
import type { LaboratoryService, RequestAuditContext } from "../services/laboratory.service.js";

function extractAuditContext(request: FastifyRequest): RequestAuditContext {
  return {
    userId: request.user?.id ?? null,
    ipAddress: request.ip || "127.0.0.1",
    userAgent:
      typeof request.headers["user-agent"] === "string"
        ? request.headers["user-agent"]
        : "SIMRS-Client",
  };
}

export class LaboratoryController {
  constructor(private readonly labService: LaboratoryService) {}

  listOrders = async (request: FastifyRequest, _reply: FastifyReply) => {
    const query = listLabOrdersQuerySchema.parse(request.query ?? {});
    const { orders, meta } = await this.labService.listOrders(query);

    return {
      success: true,
      message: "Daftar permintaan uji laboratorium berhasil dimuat.",
      data: orders,
      meta,
    };
  };

  getOrderById = async (request: FastifyRequest, _reply: FastifyReply) => {
    const { id } = orderIdParamSchema.parse(request.params);
    const order = await this.labService.getOrderById(id);

    return {
      success: true,
      message: "Detail pemeriksaan laboratorium berhasil dimuat.",
      data: order,
    };
  };

  createOrder = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createLabOrderBodySchema.parse(request.body ?? {});
    const created = await this.labService.createOrder(body, extractAuditContext(request));

    return reply.status(201).send({
      success: true,
      message: "Order uji laboratorium berhasil dibuat.",
      data: created,
    });
  };

  submitResults = async (request: FastifyRequest, _reply: FastifyReply) => {
    const { id } = orderIdParamSchema.parse(request.params);
    const body = submitLabResultsBodySchema.parse(request.body ?? {});
    const updated = await this.labService.submitResults(
      id,
      body,
      extractAuditContext(request)
    );

    return {
      success: true,
      message: "Hasil uji laboratorium berhasil disimpan dan diverifikasi.",
      data: updated,
    };
  };

  updateStatus = async (request: FastifyRequest, _reply: FastifyReply) => {
    const { id } = orderIdParamSchema.parse(request.params);
    const body = updateLabOrderStatusBodySchema.parse(request.body ?? {});
    const updated = await this.labService.updateOrderStatus(
      id,
      body,
      extractAuditContext(request)
    );

    return {
      success: true,
      message: `Status order laboratorium berhasil diperbarui menjadi ${updated.status}.`,
      data: updated,
    };
  };
}
