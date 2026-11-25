import type { FastifyReply, FastifyRequest } from "fastify";
import { analyticsDateRangeQuerySchema } from "../schemas/analytics.schema.js";
import type { AnalyticsService } from "../services/analytics.service.js";

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  getSummary = async (request: FastifyRequest, _reply: FastifyReply) => {
    const range = analyticsDateRangeQuerySchema.parse(request.query ?? {});
    const summary = await this.analyticsService.getDashboardSummary(range);

    return {
      success: true,
      message: "Data ringkasan analitik berhasil dimuat.",
      data: summary,
    };
  };

  getQueueStatus = async (request: FastifyRequest, _reply: FastifyReply) => {
    const range = analyticsDateRangeQuerySchema.parse(request.query ?? {});
    const breakdown = await this.analyticsService.getQueueStatusBreakdown(range);

    return {
      success: true,
      message: "Data distribusi status antrean berhasil dimuat.",
      data: breakdown,
    };
  };

  getLaboratorySummary = async (request: FastifyRequest, _reply: FastifyReply) => {
    const range = analyticsDateRangeQuerySchema.parse(request.query ?? {});
    const labStats = await this.analyticsService.getLaboratoryAnalytics(range);

    return {
      success: true,
      message: "Data analitik beban uji laboratorium berhasil dimuat.",
      data: labStats,
    };
  };

  getPharmacySummary = async (request: FastifyRequest, _reply: FastifyReply) => {
    const range = analyticsDateRangeQuerySchema.parse(request.query ?? {});
    const pharmaStats = await this.analyticsService.getPharmacyAnalytics(range);

    return {
      success: true,
      message: "Data analitik stok dan peresepan farmasi berhasil dimuat.",
      data: pharmaStats,
    };
  };
}
