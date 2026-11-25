import type { QueryExecutor } from "../config/db.js";
import { ConflictError } from "../errors/app-error.js";
import type {
  LabOrderStatus,
  LabStatusFlag,
  ListLabOrdersQuery,
  NormalizedLabResultEntry,
} from "../schemas/laboratory.schema.js";
import { maskNik, maskPhone } from "../utils/masking.js";

export interface LabOrderItemRecord {
  id: number;
  test_name: string;
  test_code: string;
  result_value: string | null;
  reference_range: string | null;
  unit: string | null;
  status_flag: LabStatusFlag | null;
  tariff: number;
  notes: string | null;
}

export interface LabOrderRecord {
  id: number;
  order_number: string;
  examination_id: number;
  registration_id: number;
  status: LabOrderStatus;
  clinical_notes: string | null;
  ordered_at: string;
  completed_at: string | null;
  completed_by: number | null;
  patient_id: number;
  patient_name: string;
  medical_record_number: string;
  patient_nik_masked: string | null;
  patient_phone_masked: string | null;
  doctor_id: number;
  doctor_name: string;
  polyclinic_name: string;
  items: LabOrderItemRecord[];
}

interface RawLabOrderRow {
  id: number;
  order_number: string;
  examination_id: number;
  registration_id: number;
  status: LabOrderStatus;
  clinical_notes: string | null;
  ordered_at: string | Date;
  completed_at: string | Date | null;
  completed_by: number | null;
  patient_id: number;
  patient_name: string;
  medical_record_number: string;
  patient_nik: string | null;
  patient_phone: string | null;
  doctor_id: number;
  doctor_name: string;
  polyclinic_name: string;
  items: LabOrderItemRecord[];
}

export interface LockedLabOrderRow {
  id: number;
  order_number: string;
  examination_id: number;
  registration_id: number;
  status: LabOrderStatus;
  clinical_notes: string | null;
  completed_by: number | null;
}

export interface RegistrationExamContext {
  registration_id: number;
  registration_status: string;
  examination_id: number | null;
  examination_registration_id: number | null;
}

export interface InsertLabItemRowInput {
  test_name: string;
  test_code: string;
  reference_range: string;
  unit: string;
  tariff: number;
  notes: string | null;
}

function mapRawOrderRow(row: RawLabOrderRow): LabOrderRecord {
  const orderedAt =
    row.ordered_at instanceof Date ? row.ordered_at.toISOString() : String(row.ordered_at);
  const completedAt =
    row.completed_at instanceof Date
      ? row.completed_at.toISOString()
      : row.completed_at
        ? String(row.completed_at)
        : null;

  return {
    id: Number(row.id),
    order_number: row.order_number,
    examination_id: Number(row.examination_id),
    registration_id: Number(row.registration_id),
    status: row.status,
    clinical_notes: row.clinical_notes,
    ordered_at: orderedAt,
    completed_at: completedAt,
    completed_by: row.completed_by !== null ? Number(row.completed_by) : null,
    patient_id: Number(row.patient_id),
    patient_name: row.patient_name,
    medical_record_number: row.medical_record_number,
    patient_nik_masked: maskNik(row.patient_nik),
    patient_phone_masked: maskPhone(row.patient_phone),
    doctor_id: Number(row.doctor_id),
    doctor_name: row.doctor_name,
    polyclinic_name: row.polyclinic_name,
    items: Array.isArray(row.items)
      ? row.items.map((item) => ({
          ...item,
          id: Number(item.id),
          tariff: Number(item.tariff),
        }))
      : [],
  };
}

export class LaboratoryRepository {
  constructor(private readonly db: QueryExecutor) {}

  /**
   * Lists lab orders using cursor-based keyset pagination (`lo.id < cursor`)
   * and correlated indexed item aggregation on `idx_lab_order_items_order`
   * to avoid full-table join + hash GROUP BY overhead.
   */
  async listOrders(filters: ListLabOrdersQuery): Promise<LabOrderRecord[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.status && filters.status !== "ALL") {
      params.push(filters.status);
      conditions.push(`lo.status = $${params.length}`);
    }

    if (filters.registration_id) {
      params.push(filters.registration_id);
      conditions.push(`lo.registration_id = $${params.length}`);
    }

    if (filters.examination_id) {
      params.push(filters.examination_id);
      conditions.push(`lo.examination_id = $${params.length}`);
    }

    if (filters.patient_id) {
      params.push(filters.patient_id);
      conditions.push(`r.patient_id = $${params.length}`);
    }

    if (filters.cursor) {
      params.push(filters.cursor);
      conditions.push(`lo.id < $${params.length}`);
    }

    if (filters.search && filters.search.length > 0) {
      params.push(`%${filters.search}%`);
      const idx = params.length;
      conditions.push(
        `(lo.order_number ILIKE $${idx}::text OR p.name ILIKE $${idx}::text OR p.medical_record_number ILIKE $${idx}::text OR d.name ILIKE $${idx}::text)`
      );
    }

    params.push(filters.limit);
    const limitParamIdx = params.length;

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT
        lo.id,
        lo.order_number,
        lo.examination_id,
        lo.registration_id,
        lo.status,
        lo.clinical_notes,
        lo.ordered_at,
        lo.completed_at,
        lo.completed_by,
        p.id AS patient_id,
        p.name AS patient_name,
        p.medical_record_number,
        p.nik AS patient_nik,
        p.phone AS patient_phone,
        d.id AS doctor_id,
        d.name AS doctor_name,
        poly.name AS polyclinic_name,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', loi.id,
                'test_name', loi.test_name,
                'test_code', loi.test_code,
                'result_value', loi.result_value,
                'reference_range', loi.reference_range,
                'unit', loi.unit,
                'status_flag', loi.status_flag,
                'tariff', loi.tariff::float8,
                'notes', loi.notes
              )
              ORDER BY loi.id ASC
            )
            FROM lab_order_items loi
            WHERE loi.lab_order_id = lo.id
          ),
          '[]'::json
        ) AS items
      FROM lab_orders lo
      INNER JOIN registrations r ON lo.registration_id = r.id
      INNER JOIN patients p ON r.patient_id = p.id
      INNER JOIN doctors d ON r.doctor_id = d.id
      INNER JOIN polyclinics poly ON r.polyclinic_id = poly.id
      ${whereClause}
      ORDER BY lo.id DESC
      LIMIT $${limitParamIdx};
    `;

    const { rows } = await this.db.query<RawLabOrderRow>(sql, params);
    return rows.map(mapRawOrderRow);
  }

  async findOrderById(id: number, client?: QueryExecutor): Promise<LabOrderRecord | null> {
    const executor = client ?? this.db;
    const sql = `
      SELECT
        lo.id,
        lo.order_number,
        lo.examination_id,
        lo.registration_id,
        lo.status,
        lo.clinical_notes,
        lo.ordered_at,
        lo.completed_at,
        lo.completed_by,
        p.id AS patient_id,
        p.name AS patient_name,
        p.medical_record_number,
        p.nik AS patient_nik,
        p.phone AS patient_phone,
        d.id AS doctor_id,
        d.name AS doctor_name,
        poly.name AS polyclinic_name,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', loi.id,
                'test_name', loi.test_name,
                'test_code', loi.test_code,
                'result_value', loi.result_value,
                'reference_range', loi.reference_range,
                'unit', loi.unit,
                'status_flag', loi.status_flag,
                'tariff', loi.tariff::float8,
                'notes', loi.notes
              )
              ORDER BY loi.id ASC
            )
            FROM lab_order_items loi
            WHERE loi.lab_order_id = lo.id
          ),
          '[]'::json
        ) AS items
      FROM lab_orders lo
      INNER JOIN registrations r ON lo.registration_id = r.id
      INNER JOIN patients p ON r.patient_id = p.id
      INNER JOIN doctors d ON r.doctor_id = d.id
      INNER JOIN polyclinics poly ON r.polyclinic_id = poly.id
      WHERE lo.id = $1
      LIMIT 1;
    `;
    const { rows } = await executor.query<RawLabOrderRow>(sql, [id]);
    return rows[0] ? mapRawOrderRow(rows[0]) : null;
  }

  async lockOrderById(id: number, client: QueryExecutor): Promise<LockedLabOrderRow | null> {
    const sql = `
      SELECT
        id,
        order_number,
        examination_id,
        registration_id,
        status,
        clinical_notes,
        completed_by
      FROM lab_orders
      WHERE id = $1
      FOR UPDATE;
    `;
    const { rows } = await client.query<LockedLabOrderRow>(sql, [id]);
    return rows[0] ?? null;
  }

  async findRegistrationExamContext(
    registrationId: number,
    examinationId: number | undefined,
    client: QueryExecutor
  ): Promise<RegistrationExamContext | null> {
    if (examinationId !== undefined) {
      const sql = `
        SELECT
          r.id AS registration_id,
          r.status AS registration_status,
          me.id AS examination_id,
          me.registration_id AS examination_registration_id
        FROM registrations r
        LEFT JOIN medical_examinations me ON me.id = $2
        WHERE r.id = $1
        LIMIT 1;
      `;
      const { rows } = await client.query<RegistrationExamContext>(sql, [
        registrationId,
        examinationId,
      ]);
      return rows[0] ?? null;
    }

    const sql = `
      SELECT
        r.id AS registration_id,
        r.status AS registration_status,
        me.id AS examination_id,
        me.registration_id AS examination_registration_id
      FROM registrations r
      LEFT JOIN medical_examinations me ON me.registration_id = r.id
      WHERE r.id = $1
      LIMIT 1;
    `;
    const { rows } = await client.query<RegistrationExamContext>(sql, [registrationId]);
    return rows[0] ?? null;
  }

  /**
   * Generates a race-free sequential daily lab order number (`LAB-YYYYMMDD-XXXX`)
   * using PostgreSQL transaction-level advisory locking (`pg_advisory_xact_lock`).
   */
  async generateNextOrderNumber(client: QueryExecutor): Promise<string> {
    const sql = `
      WITH lock_step AS (
        SELECT pg_advisory_xact_lock(
          hashtext('simrs_lab_order_' || to_char(CURRENT_DATE, 'YYYYMMDD'))
        )
      ),
      seq_step AS (
        SELECT
          to_char(CURRENT_DATE, 'YYYYMMDD') AS date_part,
          COALESCE(
            MAX(
              CASE
                WHEN order_number ~ '^LAB-[0-9]{8}-[0-9]+$'
                THEN CAST(SUBSTRING(order_number FROM 14) AS INTEGER)
                ELSE 0
              END
            ),
            0
          ) + 1 AS next_seq
        FROM lab_orders, lock_step
        WHERE order_number LIKE 'LAB-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-%'
      )
      SELECT 'LAB-' || date_part || '-' || LPAD(next_seq::text, 4, '0') AS order_number
      FROM seq_step;
    `;
    const { rows } = await client.query<{ order_number: string }>(sql);
    return rows[0].order_number;
  }

  async insertOrder(
    data: {
      examinationId: number;
      registrationId: number;
      orderNumber: string;
      clinicalNotes: string;
    },
    client: QueryExecutor
  ): Promise<{ id: number; order_number: string; status: LabOrderStatus; ordered_at: string }> {
    const sql = `
      INSERT INTO lab_orders (
        examination_id,
        registration_id,
        order_number,
        status,
        clinical_notes,
        ordered_at
      )
      VALUES ($1, $2, $3, 'REQUESTED', $4, CURRENT_TIMESTAMP)
      RETURNING id, order_number, status, ordered_at;
    `;
    const { rows } = await client.query<{
      id: number;
      order_number: string;
      status: LabOrderStatus;
      ordered_at: string | Date;
    }>(sql, [data.examinationId, data.registrationId, data.orderNumber, data.clinicalNotes]);

    const row = rows[0];
    return {
      id: Number(row.id),
      order_number: row.order_number,
      status: row.status,
      ordered_at:
        row.ordered_at instanceof Date ? row.ordered_at.toISOString() : String(row.ordered_at),
    };
  }

  /**
   * Bulk-inserts all lab order items in a single SQL statement via UNNEST
   * (postgres-best-practices Rule 6.1: Batch INSERT Statements).
   */
  async batchInsertItems(
    labOrderId: number,
    items: InsertLabItemRowInput[],
    client: QueryExecutor
  ): Promise<LabOrderItemRecord[]> {
    const testNames = items.map((i) => i.test_name);
    const testCodes = items.map((i) => i.test_code);
    const referenceRanges = items.map((i) => i.reference_range);
    const units = items.map((i) => i.unit);
    const tariffs = items.map((i) => i.tariff);
    const notesList = items.map((i) => i.notes);

    const sql = `
      INSERT INTO lab_order_items (
        lab_order_id,
        test_name,
        test_code,
        reference_range,
        unit,
        tariff,
        notes
      )
      SELECT
        $1,
        u.test_name,
        u.test_code,
        u.reference_range,
        u.unit,
        u.tariff,
        u.notes
      FROM UNNEST(
        $2::text[],
        $3::text[],
        $4::text[],
        $5::text[],
        $6::numeric[],
        $7::text[]
      ) AS u(test_name, test_code, reference_range, unit, tariff, notes)
      RETURNING
        id,
        test_name,
        test_code,
        result_value,
        reference_range,
        unit,
        status_flag,
        tariff::float8 AS tariff,
        notes;
    `;

    const { rows } = await client.query<LabOrderItemRecord>(sql, [
      labOrderId,
      testNames,
      testCodes,
      referenceRanges,
      units,
      tariffs,
      notesList,
    ]);

    return rows.map((r) => ({
      ...r,
      id: Number(r.id),
      tariff: Number(r.tariff),
    }));
  }

  /**
   * Batch-updates all submitted test results in a single SQL round-trip via UNNEST
   * (postgres-best-practices Rule 6.2: Eliminate N+1 Queries).
   */
  async batchUpdateResults(
    labOrderId: number,
    entries: NormalizedLabResultEntry[],
    client: QueryExecutor
  ): Promise<LabOrderItemRecord[]> {
    const itemIds = entries.map((e) => e.item_id);
    const resultValues = entries.map((e) => e.result_value);
    const statusFlags = entries.map((e) => e.status_flag);
    const referenceRanges = entries.map((e) => e.reference_range);
    const units = entries.map((e) => e.unit);
    const notesList = entries.map((e) => e.notes);

    const sql = `
      UPDATE lab_order_items AS loi
      SET
        result_value = v.result_value,
        status_flag = v.status_flag,
        reference_range = COALESCE(v.reference_range, loi.reference_range),
        unit = COALESCE(v.unit, loi.unit),
        notes = COALESCE(v.notes, loi.notes)
      FROM UNNEST(
        $2::int[],
        $3::text[],
        $4::text[],
        $5::text[],
        $6::text[],
        $7::text[]
      ) AS v(item_id, result_value, status_flag, reference_range, unit, notes)
      WHERE loi.id = v.item_id
        AND loi.lab_order_id = $1
      RETURNING
        loi.id,
        loi.test_name,
        loi.test_code,
        loi.result_value,
        loi.reference_range,
        loi.unit,
        loi.status_flag,
        loi.tariff::float8 AS tariff,
        loi.notes;
    `;

    const { rows } = await client.query<LabOrderItemRecord>(sql, [
      labOrderId,
      itemIds,
      resultValues,
      statusFlags,
      referenceRanges,
      units,
      notesList,
    ]);

    return rows.map((r) => ({
      ...r,
      id: Number(r.id),
      tariff: Number(r.tariff),
    }));
  }

  async markOrderCompleted(
    labOrderId: number,
    completedBy: number | null,
    client: QueryExecutor
  ): Promise<void> {
    await client.query(
      `
        UPDATE lab_orders
        SET status = 'COMPLETED',
            completed_at = CURRENT_TIMESTAMP,
            completed_by = $2::int
        WHERE id = $1::int;
      `,
      [labOrderId, completedBy]
    );
  }

  async updateOrderStatus(
    labOrderId: number,
    status: LabOrderStatus,
    completedBy: number | null,
    client: QueryExecutor
  ): Promise<void> {
    if (status === "CANCELLED") {
      // Zero item tariffs so Yii2 Billing::recalculate() and Node billing stay 100% consistent
      await client.query(
        `
          UPDATE lab_order_items
          SET tariff = 0,
              notes = CASE
                WHEN notes IS NULL OR notes = '' THEN '[ORDER DIBATALKAN]'
                ELSE notes || ' [ORDER DIBATALKAN]'
              END
          WHERE lab_order_id = $1::int;
        `,
        [labOrderId]
      );
    }

    await client.query(
      `
        UPDATE lab_orders
        SET status = $2::varchar(20),
            completed_at = CASE WHEN $2::text = 'COMPLETED' THEN CURRENT_TIMESTAMP ELSE completed_at END,
            completed_by = CASE WHEN $2::text = 'COMPLETED' THEN COALESCE($3::int, completed_by) ELSE completed_by END
        WHERE id = $1::int;
      `,
      [labOrderId, status, completedBy]
    );
  }

  /**
   * Atomically locks and recalculates the unified registration billing row,
   * matching `backend/models/Billing.php::recalculate()` for both GENERAL and BPJS insurance.
   */
  async recalculateBillingForRegistration(
    registrationId: number,
    client: QueryExecutor
  ): Promise<{ total_lab_fee: number; total_amount: number } | null> {
    const lockSql = `
      SELECT
        id,
        insurance_type,
        total_registration_fee::float8 AS total_registration_fee,
        total_actions_fee::float8 AS total_actions_fee,
        total_medicines_fee::float8 AS total_medicines_fee,
        payment_status
      FROM billings
      WHERE registration_id = $1
      FOR UPDATE;
    `;

    const { rows: billingRows } = await client.query<{
      id: number;
      insurance_type: "GENERAL" | "BPJS";
      total_registration_fee: number;
      total_actions_fee: number;
      total_medicines_fee: number;
      payment_status: "UNPAID" | "PAID";
    }>(lockSql, [registrationId]);

    const billing = billingRows[0];
    if (!billing) {
      return null;
    }

    if (billing.payment_status === "PAID") {
      throw new ConflictError(
        "Tagihan kunjungan pasien sudah berstatus LUNAS (PAID), perubahan biaya laboratorium tidak diizinkan."
      );
    }

    const { rows: feeRows } = await client.query<{ total_lab_fee: number }>(
      `
        SELECT COALESCE(SUM(loi.tariff), 0)::float8 AS total_lab_fee
        FROM lab_order_items loi
        INNER JOIN lab_orders lo ON lo.id = loi.lab_order_id
        WHERE lo.registration_id = $1
          AND lo.status != 'CANCELLED';
      `,
      [registrationId]
    );

    const totalLabFee = Number(feeRows[0]?.total_lab_fee ?? 0);
    const totalAmount =
      Number(billing.total_registration_fee) +
      Number(billing.total_actions_fee) +
      Number(billing.total_medicines_fee) +
      totalLabFee;

    const coveredByBpjs = billing.insurance_type === "BPJS" ? totalAmount : 0;
    const patientPayable = billing.insurance_type === "BPJS" ? 0 : totalAmount;

    await client.query(
      `
        UPDATE billings
        SET total_lab_fee = $1,
            total_amount = $2,
            covered_by_bpjs = $3,
            patient_payable = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5;
      `,
      [totalLabFee, totalAmount, coveredByBpjs, patientPayable, billing.id]
    );

    return {
      total_lab_fee: totalLabFee,
      total_amount: totalAmount,
    };
  }
}
