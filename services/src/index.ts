import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import pg from "pg";

const { Pool } = pg;

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
});

await fastify.register(helmet, {
  contentSecurityPolicy: false,
});

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || "postgres",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "simrs_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "12341234",
  max: 20,
  idleTimeoutMillis: 30000,
});

// Health check endpoint
fastify.get("/health", async () => {
  return {
    status: "ok",
    service: "ancillary-service",
    timestamp: new Date().toISOString(),
  };
});

// ==========================================
// LABORATORY REST APIS (Task 25 & Task 26)
// ==========================================

// 1. GET /api/v1/laboratory/orders - List all lab orders
fastify.get("/api/v1/laboratory/orders", async (request, reply) => {
  try {
    const query = `
      SELECT 
        lo.id,
        lo.order_number,
        lo.examination_id,
        lo.registration_id,
        lo.status,
        lo.clinical_notes,
        lo.ordered_at,
        lo.completed_at,
        p.id AS patient_id,
        p.name AS patient_name,
        p.medical_record_number,
        d.id AS doctor_id,
        d.name AS doctor_name,
        poly.name AS polyclinic_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', loi.id,
              'test_name', loi.test_name,
              'test_code', loi.test_code,
              'result_value', loi.result_value,
              'reference_range', loi.reference_range,
              'unit', loi.unit,
              'status_flag', loi.status_flag,
              'tariff', loi.tariff,
              'notes', loi.notes
            )
          ) FILTER (WHERE loi.id IS NOT NULL), '[]'
        ) AS items
      FROM lab_orders lo
      JOIN registrations r ON lo.registration_id = r.id
      JOIN patients p ON r.patient_id = p.id
      JOIN doctors d ON r.doctor_id = d.id
      JOIN polyclinics poly ON r.polyclinic_id = poly.id
      LEFT JOIN lab_order_items loi ON lo.id = loi.lab_order_id
      GROUP BY lo.id, p.id, d.id, poly.id
      ORDER BY lo.id DESC;
    `;

    const { rows } = await pool.query(query);
    return {
      success: true,
      message: "Daftar permintaan uji laboratorium berhasil dimuat.",
      data: rows,
    };
  } catch (err: any) {
    fastify.log.error(err);
    reply.status(500);
    return { success: false, message: "Gagal memuat data laboratorium: " + err.message };
  }
});

// 2. POST /api/v1/laboratory/orders - Create new lab order from doctor
fastify.post("/api/v1/laboratory/orders", async (request: any, reply) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { examination_id, registration_id, clinical_notes, items } = request.body || {};

    if (!examination_id || !registration_id || !Array.isArray(items) || items.length === 0) {
      reply.status(422);
      return { success: false, message: "examination_id, registration_id, dan items uji lab wajib diisi." };
    }

    const orderNumber = "LAB-" + Date.now().toString().slice(-6);

    const insertOrderQuery = `
      INSERT INTO lab_orders (examination_id, registration_id, order_number, status, clinical_notes, ordered_at)
      VALUES ($1, $2, $3, 'REQUESTED', $4, CURRENT_TIMESTAMP)
      RETURNING id, order_number, status, ordered_at;
    `;
    const orderRes = await client.query(insertOrderQuery, [
      examination_id,
      registration_id,
      orderNumber,
      clinical_notes || "Permintaan uji lab diagnostik",
    ]);
    const labOrderId = orderRes.rows[0].id;

    let totalTariff = 0;
    for (const item of items) {
      const tariff = Number(item.tariff) || 50000;
      totalTariff += tariff;
      const insertItemQuery = `
        INSERT INTO lab_order_items (lab_order_id, test_name, test_code, reference_range, unit, tariff, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `;
      await client.query(insertItemQuery, [
        labOrderId,
        item.test_name,
        item.test_code || "TEST-" + Math.floor(Math.random() * 900 + 100),
        item.reference_range || "Normal",
        item.unit || "-",
        tariff,
        item.notes || null,
      ]);
    }

    // Update total lab fee di tabel billings
    const updateBillingQuery = `
      UPDATE billings 
      SET total_lab_fee = total_lab_fee + $1,
          total_amount = total_amount + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE registration_id = $2;
    `;
    await client.query(updateBillingQuery, [totalTariff, registration_id]);

    await client.query("COMMIT");

    return {
      success: true,
      message: "Order uji laboratorium berhasil dibuat.",
      data: {
        id: labOrderId,
        order_number: orderNumber,
        items_count: items.length,
        total_tariff: totalTariff,
      },
    };
  } catch (err: any) {
    await client.query("ROLLBACK");
    fastify.log.error(err);
    reply.status(500);
    return { success: false, message: "Gagal membuat order lab: " + err.message };
  } finally {
    client.release();
  }
});

// 3. POST /api/v1/laboratory/orders/:id/results - Input test results by lab technician
fastify.post("/api/v1/laboratory/orders/:id/results", async (request: any, reply) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { id } = request.params;
    const { results } = request.body || {};

    if (!Array.isArray(results) || results.length === 0) {
      reply.status(422);
      return { success: false, message: "Daftar hasil pengujian laboratorium (results) wajib disertakan." };
    }

    for (const res of results) {
      const updateItemQuery = `
        UPDATE lab_order_items
        SET result_value = $1,
            status_flag = $2,
            reference_range = COALESCE($3, reference_range),
            unit = COALESCE($4, unit),
            notes = COALESCE($5, notes)
        WHERE id = $6 AND lab_order_id = $7;
      `;
      await client.query(updateItemQuery, [
        String(res.result_value),
        res.status_flag || "NORMAL",
        res.reference_range || null,
        res.unit || null,
        res.notes || null,
        res.item_id,
        id,
      ]);
    }

    // Update order status to COMPLETED
    const updateOrderQuery = `
      UPDATE lab_orders
      SET status = 'COMPLETED',
          completed_at = CURRENT_TIMESTAMP
      WHERE id = $1;
    `;
    await client.query(updateOrderQuery, [id]);

    await client.query("COMMIT");

    return {
      success: true,
      message: "Hasil uji laboratorium berhasil disimpan dan diverifikasi.",
    };
  } catch (err: any) {
    await client.query("ROLLBACK");
    fastify.log.error(err);
    reply.status(500);
    return { success: false, message: "Gagal menyimpan hasil laboratorium: " + err.message };
  } finally {
    client.release();
  }
});

// ==========================================
// ANALYTICS HIGH-PERFORMANCE REST APIS (Task 30)
// ==========================================

fastify.get("/api/v1/analytics/summary", async (request: any, reply) => {
  try {
    const { date_from, date_to } = request.query || {};

    // 1. Total Kunjungan & Pembagian Penjamin (General vs BPJS)
    const visitsQuery = `
      SELECT 
        COUNT(*)::int AS total_visits,
        COUNT(*) FILTER (WHERE insurance_type = 'GENERAL')::int AS general_visits,
        COUNT(*) FILTER (WHERE insurance_type = 'BPJS')::int AS bpjs_visits,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed_visits
      FROM registrations
      WHERE ($1::date IS NULL OR registration_date >= $1::date)
        AND ($2::date IS NULL OR registration_date <= $2::date);
    `;
    const visitsRes = await pool.query(visitsQuery, [date_from || null, date_to || null]);

    // 2. Pendapatan Kasir Terkumpul
    const revenueQuery = `
      SELECT 
        COALESCE(SUM(total_amount), 0)::numeric AS total_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE insurance_type = 'GENERAL'), 0)::numeric AS general_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE insurance_type = 'BPJS'), 0)::numeric AS bpjs_covered_revenue
      FROM billings
      WHERE payment_status = 'PAID';
    `;
    const revenueRes = await pool.query(revenueQuery);

    // 3. Distribusi Kunjungan per Poliklinik
    const polyQuery = `
      SELECT 
        p.name AS polyclinic_name,
        COUNT(r.id)::int AS visit_count
      FROM polyclinics p
      LEFT JOIN registrations r ON p.id = r.polyclinic_id
        AND ($1::date IS NULL OR r.registration_date >= $1::date)
        AND ($2::date IS NULL OR r.registration_date <= $2::date)
      GROUP BY p.id, p.name
      ORDER BY visit_count DESC;
    `;
    const polyRes = await pool.query(polyQuery, [date_from || null, date_to || null]);

    // 4. Obat Paling Banyak Diresepkan
    const medicinesQuery = `
      SELECT 
        m.name AS medicine_name,
        m.unit,
        COALESCE(SUM(pi.quantity), 0)::int AS total_prescribed
      FROM medicines m
      LEFT JOIN prescription_items pi ON m.id = pi.medicine_id
      GROUP BY m.id, m.name, m.unit
      ORDER BY total_prescribed DESC
      LIMIT 5;
    `;
    const medicinesRes = await pool.query(medicinesQuery);

    return {
      success: true,
      message: "Data ringkasan analitik berhasil dimuat.",
      data: {
        visits: visitsRes.rows[0] || { total_visits: 0, general_visits: 0, bpjs_visits: 0, completed_visits: 0 },
        revenue: revenueRes.rows[0] || { total_revenue: 0, general_revenue: 0, bpjs_covered_revenue: 0 },
        polyclinics: polyRes.rows,
        top_medicines: medicinesRes.rows,
      },
    };
  } catch (err: any) {
    fastify.log.error(err);
    reply.status(500);
    return { success: false, message: "Gagal memuat analitik: " + err.message };
  }
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 4000;
    const host = process.env.HOST || "0.0.0.0";
    await fastify.listen({ port, host });
    fastify.log.info(`Ancillary service running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
