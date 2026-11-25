-- ============================================================================
-- SIMRS Ancillary Service - PostgreSQL 17 Performance Optimization Migration
-- Compliant with /postgres-best-practices:
--   1.1 & 4.2: Index all foreign key & join columns
--   1.3: Composite indexes (equality columns first, sort/range columns last)
--   1.4: Covering indexes (INCLUDE) for Index-Only Scans
--   1.5: Partial indexes for hot filtered queries
--   7.2: Fresh planner statistics via ANALYZE
-- ============================================================================

-- 1. Missing Foreign Key Indexes (Rule 4.2)
CREATE INDEX IF NOT EXISTS idx_lab_orders_completed_by
  ON lab_orders (completed_by);

CREATE INDEX IF NOT EXISTS idx_registrations_doctor_id
  ON registrations (doctor_id);

CREATE INDEX IF NOT EXISTS idx_registrations_schedule_id
  ON registrations (schedule_id);

CREATE INDEX IF NOT EXISTS idx_prescriptions_dispensed_by
  ON prescriptions (dispensed_by);

-- 2. Composite Indexes for Filtered Keyset Pagination & Date Aggregations (Rule 1.3)
CREATE INDEX IF NOT EXISTS idx_lab_orders_status_id_desc
  ON lab_orders (status, id DESC);

CREATE INDEX IF NOT EXISTS idx_registrations_date_insurance_status
  ON registrations (registration_date, insurance_type, status);

-- 3. Partial & Covering Indexes for Zero-Heap Index-Only Scans (Rules 1.4 & 1.5)
CREATE INDEX IF NOT EXISTS idx_lab_orders_active_worklist
  ON lab_orders (id DESC)
  INCLUDE (order_number, registration_id, examination_id, status, ordered_at)
  WHERE status IN ('REQUESTED', 'IN_PROGRESS');

CREATE INDEX IF NOT EXISTS idx_billings_paid_analytics
  ON billings (registration_id, insurance_type)
  INCLUDE (total_amount, covered_by_bpjs, patient_payable, total_lab_fee)
  WHERE payment_status = 'PAID';

CREATE INDEX IF NOT EXISTS idx_medicines_active_low_stock
  ON medicines (stock ASC, name ASC)
  INCLUDE (code, unit, min_stock)
  WHERE is_active = true;

-- 4. Update Planner Statistics (Rule 7.2)
ANALYZE
  users,
  patients,
  doctors,
  polyclinics,
  registrations,
  medical_examinations,
  lab_orders,
  lab_order_items,
  prescriptions,
  prescription_items,
  medicines,
  billings,
  audit_logs;
