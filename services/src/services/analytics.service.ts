import type {
  AnalyticsRepository,
  LabAnalyticsSummary,
  PharmacyAnalyticsSummary,
  PolyclinicVisitMetric,
  QueueStatusMetric,
  RevenueSummaryMetrics,
  TopMedicineMetric,
  VisitsSummaryMetrics,
} from "../repositories/analytics.repository.js";
import type { NormalizedDateRange } from "../schemas/analytics.schema.js";

export interface DashboardSummaryData {
  period: {
    start_date: string | null;
    end_date: string | null;
  };
  visits: VisitsSummaryMetrics;
  revenue: RevenueSummaryMetrics;
  polyclinics: PolyclinicVisitMetric[];
  top_medicines: TopMedicineMetric[];
}

export class AnalyticsService {
  constructor(private readonly analyticsRepo: AnalyticsRepository) {}

  /**
   * Runs all 4 independent aggregation queries concurrently via `Promise.all`
   * (nodejs-best-practices Section 5: Parallel independent async operations).
   */
  async getDashboardSummary(range: NormalizedDateRange): Promise<DashboardSummaryData> {
    const [visits, revenue, polyclinics, topMedicines] = await Promise.all([
      this.analyticsRepo.getVisitsSummary(range),
      this.analyticsRepo.getRevenueSummary(range),
      this.analyticsRepo.getVisitsByPolyclinic(range),
      this.analyticsRepo.getTopMedicines(range, 5),
    ]);

    return {
      period: {
        start_date: range.startDate,
        end_date: range.endDate,
      },
      visits,
      revenue,
      polyclinics,
      top_medicines: topMedicines,
    };
  }

  async getQueueStatusBreakdown(range: NormalizedDateRange): Promise<{
    period: { start_date: string | null; end_date: string | null };
    total_active_queue: number;
    statuses: QueueStatusMetric[];
  }> {
    const statuses = await this.analyticsRepo.getQueueStatusBreakdown(range);
    const activeStatuses = new Set([
      "WAITING_NURSE",
      "IN_NURSE",
      "WAITING_DOCTOR",
      "IN_DOCTOR",
      "PHARMACY",
      "BILLING",
    ]);

    const totalActiveQueue = statuses
      .filter((s) => activeStatuses.has(s.status))
      .reduce((acc, s) => acc + s.count, 0);

    return {
      period: {
        start_date: range.startDate,
        end_date: range.endDate,
      },
      total_active_queue: totalActiveQueue,
      statuses,
    };
  }

  async getLaboratoryAnalytics(range: NormalizedDateRange): Promise<
    LabAnalyticsSummary & {
      period: { start_date: string | null; end_date: string | null };
    }
  > {
    const summary = await this.analyticsRepo.getLaboratoryAnalytics(range);
    return {
      period: {
        start_date: range.startDate,
        end_date: range.endDate,
      },
      ...summary,
    };
  }

  async getPharmacyAnalytics(range: NormalizedDateRange): Promise<
    PharmacyAnalyticsSummary & {
      period: { start_date: string | null; end_date: string | null };
    }
  > {
    const summary = await this.analyticsRepo.getPharmacyAnalytics(range);
    return {
      period: {
        start_date: range.startDate,
        end_date: range.endDate,
      },
      ...summary,
    };
  }
}
