import type { QueryExecutor } from "../config/db.js";
import type { NormalizedDateRange } from "../schemas/analytics.schema.js";

export interface VisitsSummaryMetrics {
  total_visits: number;
  general_visits: number;
  bpjs_visits: number;
  completed_visits: number;
}

export interface RevenueSummaryMetrics {
  total_revenue: number;
  general_revenue: number;
  bpjs_covered_revenue: number;
}

export interface PolyclinicVisitMetric {
  polyclinic_name: string;
  visit_count: number;
}

export interface TopMedicineMetric {
  medicine_name: string;
  unit: string;
  total_prescribed: number;
}

export interface QueueStatusMetric {
  status: string;
  count: number;
}

export interface LabAnalyticsSummary {
  total_orders: number;
  requested_orders: number;
  in_progress_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_test_items: number;
  abnormal_items: number;
  total_lab_tariff: number;
  top_tests: Array<{
    test_code: string;
    test_name: string;
    order_count: number;
    abnormal_count: number;
  }>;
}

export interface PharmacyAnalyticsSummary {
  total_active_medicines: number;
  low_stock_count: number;
  out_of_stock_count: number;
  pending_prescriptions: number;
  dispensed_prescriptions: number;
  low_stock_medicines: Array<{
    id: number;
    code: string;
    name: string;
    unit: string;
    stock: number;
    min_stock: number;
  }>;
}

function buildDateFilter(
  column: string,
  range: NormalizedDateRange,
  initialParams: unknown[] = []
): { predicates: string[]; params: unknown[] } {
  const predicates: string[] = [];
  const params = [...initialParams];

  if (range.startDate) {
    params.push(range.startDate);
    predicates.push(`${column} >= $${params.length}::date`);
  }

  if (range.endDate) {
    params.push(range.endDate);
    predicates.push(`${column} <= $${params.length}::date`);
  }

  return { predicates, params };
}

/**
 * High-performance PostgreSQL 17 analytics repository.
 * Avoids `($1::date IS NULL OR col >= $1::date)` anti-patterns so the query planner
 * uses clean B-tree range scans on composite registration and billing indexes.
 */
export class AnalyticsRepository {
  constructor(private readonly db: QueryExecutor) {}

  async getVisitsSummary(range: NormalizedDateRange): Promise<VisitsSummaryMetrics> {
    const { predicates, params } = buildDateFilter("registration_date", range);
    const whereClause = predicates.length > 0 ? `WHERE ${predicates.join(" AND ")}` : "";

    const sql = `
      SELECT
        COUNT(*)::int AS total_visits,
        COUNT(*) FILTER (WHERE insurance_type = 'GENERAL')::int AS general_visits,
        COUNT(*) FILTER (WHERE insurance_type = 'BPJS')::int AS bpjs_visits,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed_visits
      FROM registrations
      ${whereClause};
    `;

    const { rows } = await this.db.query<VisitsSummaryMetrics>(sql, params);
    const row = rows[0];
    return {
      total_visits: Number(row?.total_visits ?? 0),
      general_visits: Number(row?.general_visits ?? 0),
      bpjs_visits: Number(row?.bpjs_visits ?? 0),
      completed_visits: Number(row?.completed_visits ?? 0),
    };
  }

  async getRevenueSummary(range: NormalizedDateRange): Promise<RevenueSummaryMetrics> {
    const { predicates, params } = buildDateFilter("r.registration_date", range);
    const allConditions = ["b.payment_status = 'PAID'", ...predicates];

    const sql = `
      SELECT
        COALESCE(SUM(b.total_amount), 0)::float8 AS total_revenue,
        COALESCE(SUM(b.total_amount) FILTER (WHERE b.insurance_type = 'GENERAL'), 0)::float8 AS general_revenue,
        COALESCE(SUM(b.total_amount) FILTER (WHERE b.insurance_type = 'BPJS'), 0)::float8 AS bpjs_covered_revenue
      FROM billings b
      INNER JOIN registrations r ON r.id = b.registration_id
      WHERE ${allConditions.join(" AND ")};
    `;

    const { rows } = await this.db.query<RevenueSummaryMetrics>(sql, params);
    const row = rows[0];
    return {
      total_revenue: Number(row?.total_revenue ?? 0),
      general_revenue: Number(row?.general_revenue ?? 0),
      bpjs_covered_revenue: Number(row?.bpjs_covered_revenue ?? 0),
    };
  }

  async getVisitsByPolyclinic(range: NormalizedDateRange): Promise<PolyclinicVisitMetric[]> {
    const { predicates, params } = buildDateFilter("r.registration_date", range);
    const joinDateFilter = predicates.length > 0 ? `AND ${predicates.join(" AND ")}` : "";

    const sql = `
      SELECT
        p.name AS polyclinic_name,
        COUNT(r.id)::int AS visit_count
      FROM polyclinics p
      LEFT JOIN registrations r
        ON p.id = r.polyclinic_id
        AND r.status != 'CANCELLED'
        ${joinDateFilter}
      WHERE p.is_active = true
      GROUP BY p.id, p.name
      ORDER BY visit_count DESC, p.name ASC;
    `;

    const { rows } = await this.db.query<PolyclinicVisitMetric>(sql, params);
    return rows.map((r) => ({
      polyclinic_name: r.polyclinic_name,
      visit_count: Number(r.visit_count),
    }));
  }

  async getTopMedicines(range: NormalizedDateRange, limit = 5): Promise<TopMedicineMetric[]> {
    const { predicates, params } = buildDateFilter("r.registration_date", range);
    const prescConditions = ["pr.status != 'CANCELLED'", ...predicates];
    params.push(limit);
    const limitIdx = params.length;

    const sql = `
      WITH prescribed_totals AS (
        SELECT
          pi.medicine_id,
          SUM(pi.quantity)::int AS total_qty
        FROM prescription_items pi
        INNER JOIN prescriptions pr ON pr.id = pi.prescription_id
        INNER JOIN registrations r ON r.id = pr.registration_id
        WHERE ${prescConditions.join(" AND ")}
        GROUP BY pi.medicine_id
      )
      SELECT
        m.name AS medicine_name,
        m.unit,
        COALESCE(pt.total_qty, 0)::int AS total_prescribed
      FROM medicines m
      LEFT JOIN prescribed_totals pt ON pt.medicine_id = m.id
      WHERE m.is_active = true
      ORDER BY total_prescribed DESC, m.name ASC
      LIMIT $${limitIdx};
    `;

    const { rows } = await this.db.query<TopMedicineMetric>(sql, params);
    return rows.map((r) => ({
      medicine_name: r.medicine_name,
      unit: r.unit,
      total_prescribed: Number(r.total_prescribed),
    }));
  }

  async getQueueStatusBreakdown(range: NormalizedDateRange): Promise<QueueStatusMetric[]> {
    const { predicates, params } = buildDateFilter("registration_date", range);
    const whereClause = predicates.length > 0 ? `WHERE ${predicates.join(" AND ")}` : "";

    const sql = `
      SELECT
        status,
        COUNT(*)::int AS count
      FROM registrations
      ${whereClause}
      GROUP BY status
      ORDER BY count DESC, status ASC;
    `;

    const { rows } = await this.db.query<QueueStatusMetric>(sql, params);
    return rows.map((r) => ({
      status: r.status,
      count: Number(r.count),
    }));
  }

  async getLaboratoryAnalytics(range: NormalizedDateRange): Promise<LabAnalyticsSummary> {
    const { predicates, params } = buildDateFilter("r.registration_date", range);
    const whereClause = predicates.length > 0 ? `WHERE ${predicates.join(" AND ")}` : "";

    const ordersSql = `
      SELECT
        COUNT(lo.id)::int AS total_orders,
        COUNT(lo.id) FILTER (WHERE lo.status = 'REQUESTED')::int AS requested_orders,
        COUNT(lo.id) FILTER (WHERE lo.status = 'IN_PROGRESS')::int AS in_progress_orders,
        COUNT(lo.id) FILTER (WHERE lo.status = 'COMPLETED')::int AS completed_orders,
        COUNT(lo.id) FILTER (WHERE lo.status = 'CANCELLED')::int AS cancelled_orders
      FROM lab_orders lo
      INNER JOIN registrations r ON r.id = lo.registration_id
      ${whereClause};
    `;

    const itemConditions = ["lo.status != 'CANCELLED'", ...predicates];
    const itemsSql = `
      SELECT
        COUNT(loi.id)::int AS total_test_items,
        COUNT(loi.id) FILTER (WHERE loi.status_flag IN ('ABNORMAL', 'HIGH', 'LOW'))::int AS abnormal_items,
        COALESCE(SUM(loi.tariff), 0)::float8 AS total_lab_tariff
      FROM lab_order_items loi
      INNER JOIN lab_orders lo ON lo.id = loi.lab_order_id
      INNER JOIN registrations r ON r.id = lo.registration_id
      WHERE ${itemConditions.join(" AND ")};
    `;

    const topTestsSql = `
      SELECT
        loi.test_code,
        loi.test_name,
        COUNT(loi.id)::int AS order_count,
        COUNT(loi.id) FILTER (WHERE loi.status_flag IN ('ABNORMAL', 'HIGH', 'LOW'))::int AS abnormal_count
      FROM lab_order_items loi
      INNER JOIN lab_orders lo ON lo.id = loi.lab_order_id
      INNER JOIN registrations r ON r.id = lo.registration_id
      WHERE ${itemConditions.join(" AND ")}
      GROUP BY loi.test_code, loi.test_name
      ORDER BY order_count DESC, loi.test_name ASC
      LIMIT 5;
    `;

    const [ordersRes, itemsRes, topTestsRes] = await Promise.all([
      this.db.query(ordersSql, params),
      this.db.query(itemsSql, params),
      this.db.query(topTestsSql, params),
    ]);

    const orderRow = ordersRes.rows[0] ?? {};
    const itemRow = itemsRes.rows[0] ?? {};

    return {
      total_orders: Number(orderRow.total_orders ?? 0),
      requested_orders: Number(orderRow.requested_orders ?? 0),
      in_progress_orders: Number(orderRow.in_progress_orders ?? 0),
      completed_orders: Number(orderRow.completed_orders ?? 0),
      cancelled_orders: Number(orderRow.cancelled_orders ?? 0),
      total_test_items: Number(itemRow.total_test_items ?? 0),
      abnormal_items: Number(itemRow.abnormal_items ?? 0),
      total_lab_tariff: Number(itemRow.total_lab_tariff ?? 0),
      top_tests: topTestsRes.rows.map((r) => ({
        test_code: r.test_code,
        test_name: r.test_name,
        order_count: Number(r.order_count),
        abnormal_count: Number(r.abnormal_count),
      })),
    };
  }

  async getPharmacyAnalytics(range: NormalizedDateRange): Promise<PharmacyAnalyticsSummary> {
    const { predicates, params } = buildDateFilter("r.registration_date", range);
    const whereClause = predicates.length > 0 ? `WHERE ${predicates.join(" AND ")}` : "";

    const stockStatsSql = `
      SELECT
        COUNT(*) FILTER (WHERE is_active = true)::int AS total_active_medicines,
        COUNT(*) FILTER (WHERE is_active = true AND stock <= min_stock AND stock > 0)::int AS low_stock_count,
        COUNT(*) FILTER (WHERE is_active = true AND stock = 0)::int AS out_of_stock_count
      FROM medicines;
    `;

    const lowStockListSql = `
      SELECT id, code, name, unit, stock, min_stock
      FROM medicines
      WHERE is_active = true
        AND stock <= min_stock
      ORDER BY stock ASC, name ASC
      LIMIT 10;
    `;

    const prescriptionsSql = `
      SELECT
        COUNT(pr.id) FILTER (WHERE pr.status = 'PENDING')::int AS pending_prescriptions,
        COUNT(pr.id) FILTER (WHERE pr.status = 'DISPENSED')::int AS dispensed_prescriptions
      FROM prescriptions pr
      INNER JOIN registrations r ON r.id = pr.registration_id
      ${whereClause};
    `;

    const [stockRes, lowListRes, prescRes] = await Promise.all([
      this.db.query(stockStatsSql),
      this.db.query(lowStockListSql),
      this.db.query(prescriptionsSql, params),
    ]);

    const stockRow = stockRes.rows[0] ?? {};
    const prescRow = prescRes.rows[0] ?? {};

    return {
      total_active_medicines: Number(stockRow.total_active_medicines ?? 0),
      low_stock_count: Number(stockRow.low_stock_count ?? 0),
      out_of_stock_count: Number(stockRow.out_of_stock_count ?? 0),
      pending_prescriptions: Number(prescRow.pending_prescriptions ?? 0),
      dispensed_prescriptions: Number(prescRow.dispensed_prescriptions ?? 0),
      low_stock_medicines: lowListRes.rows.map((r) => ({
        id: Number(r.id),
        code: r.code,
        name: r.name,
        unit: r.unit,
        stock: Number(r.stock),
        min_stock: Number(r.min_stock),
      })),
    };
  }
}
