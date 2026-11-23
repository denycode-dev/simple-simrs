# Simple SIMRS Rawat Jalan Terintegrasi Implementation Plan (Lengkap & Terpadu)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Membangun Sistem Informasi Manajemen Rumah Sakit (SIMRS) Pelayanan Rawat Jalan Terintegrasi secara menyeluruh mencakup seluruh 9 modul inti studi kasus: pendaftaran kunjungan (Umum/BPJS), skrining awal keperawatan oleh nakes (TTV, antropometri, riwayat alergi/penyakit), pemeriksaan klinis RME oleh dokter poliklinik, tindakan medis, e-resep farmasi dengan pengurangan stok atomik, pemeriksaan penunjang laboratorium via Fastify Node.js service, billing kasir (Cash Full Payment atau Ditanggung Penuh BPJS) dengan proteksi transaksi ganda, dashboard analitik operasional berbasis 7 hak akses pengguna, **DITAMBAHKAN** Modul Audit Trail & Data Masking perlindungan data pribadi (UU No. 27 Tahun 2022 / UU PDP), serta standarisasi validasi form inline dan penanganan error global.

**Architecture:** Arsitektur hybrid multi-tier: Frontend React 19 SPA (Astryx Design System, Vercel React Best Practices, Inline Field Validation, Global Error Boundary) berkomunikasi dengan Backend Utama Yii 2 (PHP 8.4, Yii2-Core, Audit Trail Behavior, Masking Service) untuk transaksi inti ACID database PostgreSQL 17, didukung oleh Node.js Fastify Service (`services/ancillary-service`) untuk integrasi LIS penunjang lab dan agregasi analitik performa tinggi, diorkestrasikan melalui Docker Compose.

**Tech Stack:** React 19, TypeScript, Vite, @astryxdesign/core, Yii 2 (PHP 8.4, Yii2-Core), Node.js 22 (Fastify, TypeScript, Zod), PostgreSQL 17 (PostgreSQL Optimization, Append-Only Audit Logs), Docker Compose, Codeception / PHPUnit, Vitest, Postman.

---

## Daftar Tahapan & Tugas Implementasi

- [x] **Phase 1: Database Migrations & Comprehensive Seeders (PostgreSQL 17)**
  - [x] Task 1: Migrasi Tabel Pengguna & 7 Role RBAC (`users`, `nurses`, `doctors`)
  - [x] Task 2: Migrasi Tabel Master Data & Indeks Teroptimasi (`patients`, `polyclinics`, `doctor_schedules`, `medical_actions`, `medicines`, `medicine_stock_logs`)
  - [x] Task 3: Migrasi Tabel Transaksi Pelayanan Rawat Jalan (`registrations`, `nurse_assessments`, `medical_examinations`, `examination_actions`, `prescriptions`, `prescription_items`, `lab_orders`, `lab_order_items`, `billings`, `billing_payments`)
  - [x] Task 4: Database Seeder Lengkap Data Master & 7 Akun Peran Pengguna
- [ ] **Phase 2: Backend Yii 2 Core REST API & Security Foundation**
  - [x] Task 5: Konfigurasi UrlManager REST, Response Formatter JSON Berbahasa Indonesia, dan CORS
  - [ ] Task 6: Model User Database ActiveRecord dengan Hashing Bcrypt & Bearer Token Authentication
  - [ ] Task 7: Controller Autentikasi (`AuthController`: Login, Me, Logout) & AccessControl Behavior
- [ ] **Phase 3: Modul 1 - Pengelolaan Master Data**
  - [ ] Task 8: API Master Pasien dengan Validasi Unik NIK 16 Digit & No RM Otomatis
  - [ ] Task 9: API Master Dokter, Poli, & Jadwal dengan Pencegahan Bentrok Waktu Dokter
  - [ ] Task 10: API Master Tindakan Medis & Obat dengan Logging Mutasi Stok Audit
  - [ ] Task 11: Frontend UI Manajemen Master Data dengan Astryx Components & Zero Waterfall
- [ ] **Phase 4: Modul 2 - Pendaftaran & Antrean Pasien**
  - [ ] Task 12: API Pendaftaran Kunjungan (Penjamin Umum vs BPJS) & Generator Antrean Harian Otomatis
  - [ ] Task 13: Frontend Form Pendaftaran Pasien Cepat, Opsi Penjamin BPJS & Cetak Karcis Antrean
  - [ ] Task 14: API & UI Manajemen Transisi Status Antrean Pasien
- [ ] **Phase 5: Modul 2.5 & 3 - Skrining Awal Nakes & Pemeriksaan RME Dokter**
  - [ ] Task 15: API Asesmen Awal Keperawatan (Umur, JK, BB, TB, TTV, Alergi & Riwayat Penyakit)
  - [ ] Task 16: Frontend Antarmuka Skrining Nakes & Pemanggilan Pasien Menuju Dokter Poli
  - [ ] Task 17: API RME Dokter: Membaca Asesmen Awal Nakes, Pemeriksaan Fisik, & Diagnosis ICD-10
  - [ ] Task 18: Frontend Antarmuka Konsultasi Dokter: Kartu Informasi Awal Nakes & Input SOAP
- [ ] **Phase 6: Modul 4 & 5 - Tindakan Medis & Farmasi e-Resep dengan Mutasi Stok Atomik**
  - [ ] Task 19: API Input Tindakan Medis & Penguncian Tarif Tagihan Billing Otomatis
  - [ ] Task 20: API e-Resep Dokter dengan Validasi Ketersediaan Stok Real-time
  - [ ] Task 21: API Dispensing Obat Farmasi dengan Transaksi Atomik (`FOR UPDATE`) & Log Mutasi Stok
  - [ ] Task 22: Frontend UI Antrean Resep Farmasi, Telaah Dosis, & Penyerahan Obat ke Pasien
- [ ] **Phase 7: Modul 6 - Pemeriksaan Penunjang (Fastify Node.js Service)**
  - [ ] Task 23: Inisialisasi Service Fastify Node.js (`services/ancillary-service`), Zod Validation, & Dockerfile
  - [ ] Task 24: Integrasi Service Node.js ke Root `docker-compose.yml` pada Port 4000
  - [ ] Task 25: API Order Uji Lab & Input Hasil Pengujian dengan Flag Status Normal/Abnormal
  - [ ] Task 26: Frontend UI Order Lab oleh Dokter & Form Input Hasil oleh Petugas Laboratorium
- [ ] **Phase 8: Modul 7 - Billing & Kasir Pembayaran (Cash Full Payment / Cover BPJS)**
  - [ ] Task 27: API Agregasi Biaya Tagihan Terpadu (Pendaftaran + Tindakan + Lab + Obat)
  - [ ] Task 28: API Pembayaran Kasir Atomik (Cash Full Payment dengan Kembalian / Cover BPJS) & Row Locking
  - [ ] Task 29: Frontend UI Kasir: Rincian Tagihan, Simulasi Pembayaran Tunai/BPJS & Cetak Kuitansi
- [ ] **Phase 9: Modul 8 - Dashboard & Laporan Analitik**
  - [ ] Task 30: Fastify High-Performance Analytics Aggregation API (Query Terindeks PostgreSQL)
  - [ ] Task 31: Frontend Dashboard Visual: KPI Cards, Filter Periode Tanggal, & Grafik Layanan
- [ ] **Phase 10: Modul 10 - Audit Trail & Pelindungan Data Pribadi (UU PDP No. 27/2022)**
  - [ ] Task 32: Migrasi Tabel Append-Only `audit_logs` dengan Composite Indexing
  - [ ] Task 33: Implementasi `AuditTrailBehavior` Yii2 dengan Sanitasi Kredensial Otomatis
  - [ ] Task 34: Service Backend Data Masking Pasien (NIK, Telepon, Alamat, Email) & Endpoint Unmask Data
  - [ ] Task 35: Frontend Komponen `<MaskedField />` dengan Ikon Mata (Show/Hide) & Permission Guard
  - [ ] Task 36: Frontend Antarmuka Viewer Audit Trail (Khusus Administrator)
- [ ] **Phase 11: Standarisasi Form Validation Inline & Penanganan Error Global**
  - [ ] Task 37: Komponen Form Input Standar (`FormField`) dengan Pesan Validasi Inline & Aksesibilitas ARIA
  - [ ] Task 38: Hook `useAppForm` dengan Pemetaan Error 422 Backend ke Field Form & Preservasi Nilai Input
  - [ ] Task 39: Provider `GlobalErrorModal` Terpusat untuk Error 500, Network Disconnect, 401, dan 403
- [ ] **Phase 12: Finalisasi RBAC, Postman Collection, & Verification**
  - [ ] Task 40: Audit Keamanan RBAC Seluruh Endpoint & Route Guards 7 Peran Pengguna
  - [ ] Task 41: Ekspor Automated Postman Collection Test Suite v2.1.0 (`docs/postman/SIMRS_Outpatient_Collection.json`)
  - [ ] Task 42: Panduan Uji Manual End-to-End & Checklist Kepatuhan Sistem

---

## Rincian Tugas Implementasi Granular (Task Breakdown)

### Task 1: Migrasi Tabel Pengguna & 7 Role RBAC

**Files:**
- Create: `backend/migrations/m261123_000001_create_users_table.php`
- Test: `backend/tests/Unit/Models/UserMigrationTest.php`

**Step 1: Write the failing test**
Memverifikasi tabel `users`, `nurses`, dan `doctors` terbuat dengan 7 peran: `admin`, `registration`, `nurse`, `doctor`, `pharmacist`, `lab`, `cashier`.

**Step 2: Run test to verify it fails**
Run: `php backend/yii test unit Unit/Models/UserMigrationTest.php`
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan migrasi DDL dengan constraint check role dan foreign key ke `users`.

**Step 4: Run test to verify it passes**
Run: `php backend/yii migrate --interactive=0 && php backend/yii test unit Unit/Models/UserMigrationTest.php`
Expected: PASS

**Step 5: Commit**
```bash
git add backend/migrations/m261123_000001_create_users_table.php backend/tests/Unit/Models/UserMigrationTest.php
git commit -m "feat(db): create users, doctors, and nurses tables with 7 rbac roles"
```

---

### Task 2: Migrasi Tabel Master Data & Indeks Teroptimasi

**Files:**
- Create: `backend/migrations/m261123_000002_create_master_tables.php`
- Test: `backend/tests/Unit/Models/MasterTablesMigrationTest.php`

**Step 1: Write the failing test**
Memverifikasi tabel `patients`, `polyclinics`, `doctor_schedules`, `medical_actions`, `medicines`, dan `medicine_stock_logs` ada dengan B-Tree index pada NIK dan No RM.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan migrasi tabel master data sesuai kamus skema di `SPECIFICATION.md`.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/migrations/m261123_000002_create_master_tables.php backend/tests/Unit/Models/MasterTablesMigrationTest.php
git commit -m "feat(db): create master data tables with b-tree indexes and constraints"
```

---

### Task 3: Migrasi Tabel Transaksi Pelayanan Rawat Jalan

**Files:**
- Create: `backend/migrations/m261123_000003_create_transaction_tables.php`
- Test: `backend/tests/Unit/Models/TransactionTablesMigrationTest.php`

**Step 1: Write the failing test**
Memverifikasi tabel `registrations`, `nurse_assessments`, `medical_examinations`, `examination_actions`, `prescriptions`, `prescription_items`, `lab_orders`, `lab_order_items`, `billings`, dan `billing_payments` telah dibuat.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan DDL tabel transaksi dengan composite index `(polyclinic_id, registration_date)` dan `(registration_date, status)`.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/migrations/m261123_000003_create_transaction_tables.php backend/tests/Unit/Models/TransactionTablesMigrationTest.php
git commit -m "feat(db): create clinical transactions, nurse assessment, and billing schema"
```

---

### Task 4: Database Seeder Lengkap Data Master & 7 Akun Peran

**Files:**
- Create: `backend/commands/SeedController.php`
- Test: `backend/tests/Unit/SeedCheckTest.php`

**Step 1: Write the failing test**
Memverifikasi 7 akun pengguna (`admin`, `pendaftaran`, `perawat1`, `dokter1`, `dokter2`, `farmasi1`, `lab1`, `kasir1`), master poli, jadwal, tindakan, 10 obat dengan stok awal, dan 5 pasien demo telah terisi di database.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Tulis logic seeder lengkap pada `SeedController.php`.

**Step 4: Run test to verify it passes**
Run: `php backend/yii seed && php backend/yii test unit Unit/SeedCheckTest.php`
Expected: PASS

**Step 5: Commit**
```bash
git add backend/commands/SeedController.php backend/tests/Unit/SeedCheckTest.php
git commit -m "feat(db): create comprehensive database seeder for 7 roles, master data, and initial stock"
```

---

### Task 5: Konfigurasi UrlManager REST, Response Formatter JSON & CORS

**Files:**
- Modify: `backend/config/web.php`
- Create: `backend/controllers/api/BaseApiController.php`
- Test: `backend/tests/Functional/ApiFormatTest.php`

**Step 1: Write the failing test**
Memverifikasi response JSON standar: `{"success": true, "message": "...", "data": {...}}` dan header CORS.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Konfigurasi `web.php` dan `BaseApiController.php` sesuai kaidah `/yii2-core`.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/config/web.php backend/controllers/api/BaseApiController.php
git commit -m "feat(api): configure rest routing, indonesian response formatter, and cors"
```

---

### Task 6: Model User Database ActiveRecord & Bearer Token Authentication

**Files:**
- Modify: `backend/models/User.php`
- Test: `backend/tests/Unit/Models/UserAuthTest.php`

**Step 1: Write the failing test**
Memverifikasi `User::findByUsername('dokter1')` berhasil membaca dari PostgreSQL dan memvalidasi password `admin123`.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan `User` sebagai ActiveRecord turunan IdentityInterface.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/models/User.php backend/tests/Unit/Models/UserAuthTest.php
git commit -m "feat(auth): implement postgresql active record user model with bearer token auth"
```

---

### Task 7: Controller Autentikasi (`AuthController`: Login, Me, Logout)

**Files:**
- Create: `backend/controllers/api/AuthController.php`
- Test: `backend/tests/Functional/AuthApiCest.php`

**Step 1: Write the failing test**
Uji endpoint `POST /api/v1/auth/login` menghasilkan token Bearer dan data peran pengguna.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan `actionLogin()`, `actionMe()`, dan `actionLogout()` dengan pesan berbahasa Indonesia.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/controllers/api/AuthController.php backend/tests/Functional/AuthApiCest.php
git commit -m "feat(api): implement auth controller with token issuance and indonesian messages"
```

---

### Task 8: API Master Pasien dengan Validasi Unik NIK & No RM

**Files:**
- Create: `backend/models/Patient.php`
- Create: `backend/controllers/api/PatientController.php`
- Test: `backend/tests/Functional/PatientApiCest.php`

**Step 1: Write the failing test**
Uji create pasien: NIK 16 digit valid, pencegahan NIK ganda, No RM auto-generate format `RM-YYYYMM-XXXXX`.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan model `Patient.php` dengan `rules()` dan controller CRUD.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/models/Patient.php backend/controllers/api/PatientController.php
git commit -m "feat(api): implement patient master data api with unique nik check and auto mrn generator"
```

---

### Task 9: API Master Dokter, Poli, & Jadwal (Pencegahan Bentrok Waktu)

**Files:**
- Create: `backend/models/Doctor.php`, `backend/models/Polyclinic.php`, `backend/models/DoctorSchedule.php`
- Create: `backend/controllers/api/DoctorController.php`, `backend/controllers/api/PolyclinicController.php`, `backend/controllers/api/DoctorScheduleController.php`
- Test: `backend/tests/Functional/ScheduleConflictTest.php`

**Step 1: Write the failing test**
Memverifikasi jadwal yang bertabrakan jamnya pada dokter dan hari yang sama ditolak dengan pesan: "Jadwal dokter bentrok dengan jadwal lain pada hari yang sama".

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Validasi kustom waktu tumpang tindih di `DoctorSchedule::rules()`.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/models/Doctor*.php backend/models/Polyclinic.php backend/controllers/api/Doctor*.php backend/controllers/api/PolyclinicController.php
git commit -m "feat(api): implement doctor and schedule apis with schedule overlap prevention"
```

---

### Task 10: API Master Tindakan Medis & Obat (Audit Mutasi Stok)

**Files:**
- Create: `backend/models/MedicalAction.php`, `backend/models/Medicine.php`, `backend/models/MedicineStockLog.php`
- Create: `backend/controllers/api/MedicalActionController.php`, `backend/controllers/api/MedicineController.php`
- Test: `backend/tests/Functional/MedicineStockTest.php`

**Step 1: Write the failing test**
Memverifikasi penyesuaian stok obat mencatat riwayat mutasi di `medicine_stock_logs`.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan CRUD `MedicalAction` dan `Medicine::adjustStock()`.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/models/MedicalAction.php backend/models/Medicine*.php backend/controllers/api/MedicalActionController.php backend/controllers/api/MedicineController.php
git commit -m "feat(api): implement medical actions and medicine apis with audit stock logs"
```

---

### Task 11: Frontend UI Manajemen Master Data

**Files:**
- Create: `frontend/src/features/master/patients/MasterPatientsPage.tsx`
- Create: `frontend/src/features/master/medicines/MasterMedicinesPage.tsx`
- Create: `frontend/src/features/master/doctors/MasterDoctorsPage.tsx`
- Modify: `frontend/src/config/dashboard-menu.ts`
- Test: `frontend/src/features/master/MasterPatients.test.tsx`

**Step 1: Write the failing test**
Memverifikasi tabel pasien menampilkan kolom No RM, NIK, dan Nama Pasien.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Bangun antarmuka master data terpadu menggunakan Astryx components.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add frontend/src/features/master/ frontend/src/config/dashboard-menu.ts
git commit -m "feat(frontend): build master data management interfaces for patients, doctors, and medicines"
```

---

### Task 12: API Pendaftaran Kunjungan (Penjamin Umum vs BPJS & Antrean Otomatis)

**Files:**
- Create: `backend/models/Registration.php`
- Create: `backend/controllers/api/RegistrationController.php`
- Test: `backend/tests/Functional/RegistrationApiCest.php`

**Step 1: Write the failing test**
Uji registrasi menghasilkan antrean harian dan status awal `WAITING_NURSE`.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan penomoran antrean berurutan harian per poli dan pembuatan draf billing.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/models/Registration.php backend/controllers/api/RegistrationController.php
git commit -m "feat(api): implement registration api with bpjs/general insurance support and queue sequence"
```

---

### Task 13: Frontend Form Pendaftaran Pasien Cepat & Cetak Karcis Antrean

**Files:**
- Create: `frontend/src/features/registration/components/RegistrationForm.tsx`
- Create: `frontend/src/features/registration/components/QueueTicketModal.tsx`
- Test: `frontend/src/features/registration/RegistrationForm.test.tsx`

**Step 1: Write the failing test**
Verifikasi formulir pendaftaran menampilkan autocomplete pasien, pilihan penjamin, dan karcis antrean cetak.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Bangun form pendaftaran pasien menggunakan autocomplete pasien dan modal tiket antrean.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add frontend/src/features/registration/
git commit -m "feat(frontend): implement registration form with insurance selector and printable queue ticket"
```

---

### Task 14: API & UI Manajemen Transisi Status Antrean Pasien

**Files:**
- Modify: `backend/controllers/api/RegistrationController.php`
- Create: `frontend/src/features/registration/components/QueueStatusBoard.tsx`
- Test: `backend/tests/Functional/QueueLifecycleTest.php`

**Step 1: Write the failing test**
Uji transisi status: `WAITING_NURSE` $\to$ `IN_NURSE` $\to$ `WAITING_DOCTOR` $\to$ `IN_DOCTOR` $\to$ `PHARMACY` $\to$ `BILLING` $\to$ `COMPLETED`.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Action `PATCH /api/v1/registrations/{id}/status` dan antarmuka live board status antrean.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/controllers/api/RegistrationController.php frontend/src/features/registration/components/QueueStatusBoard.tsx
git commit -m "feat: implement registration status lifecycle transitions and live queue board"
```

---

### Task 15: API Asesmen Awal Keperawatan (TTV, Antropometri, Alergi & Riwayat Penyakit)

**Files:**
- Create: `backend/models/NurseAssessment.php`
- Create: `backend/controllers/api/NurseAssessmentController.php`
- Test: `backend/tests/Functional/NurseAssessmentApiCest.php`

**Step 1: Write the failing test**
Uji penyimpanan asesmen keperawatan dan otomatis memajukan status registrasi ke `WAITING_DOCTOR`.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan model dan controller asesmen nakes di dalam DB transaction.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/models/NurseAssessment.php backend/controllers/api/NurseAssessmentController.php
git commit -m "feat(api): implement nurse initial assessment api with vital signs and auto queue advance"
```

---

### Task 16: Frontend Antarmuka Skrining Nakes (Ruang Triage)

**Files:**
- Create: `frontend/src/features/nurse/components/NurseQueueList.tsx`
- Create: `frontend/src/features/nurse/components/NurseAssessmentForm.tsx`
- Test: `frontend/src/features/nurse/NurseAssessmentForm.test.tsx`

**Step 1: Write the failing test**
Verifikasi formulir skrining nakes menampilkan input TTV, BB/TB, keluhan, dan riwayat alergi.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Bangun antarmuka modul perawat dengan form pemeriksaan lengkap.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add frontend/src/features/nurse/
git commit -m "feat(frontend): build nurse initial triage and vital signs screening interface"
```

---

### Task 17: API RME Dokter (Membaca Asesmen Nakes & Input SOAP ICD-10)

**Files:**
- Create: `backend/models/MedicalExamination.php`
- Create: `backend/controllers/api/ExaminationController.php`
- Test: `backend/tests/Functional/DoctorExaminationApiCest.php`

**Step 1: Write the failing test**
Uji membaca asesmen nakes dan menyimpan SOAP serta diagnosis ICD-10 dokter.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan `ExaminationController.php` dengan eager loading relasi `nurseAssessment`.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/models/MedicalExamination.php backend/controllers/api/ExaminationController.php
git commit -m "feat(api): implement doctor examination ehr api linked with nurse initial assessment"
```

---

### Task 18: Frontend Antarmuka Konsultasi Dokter (Kartu Info Nakes & Input SOAP)

**Files:**
- Create: `frontend/src/features/examination/components/InitialAssessmentCard.tsx`
- Create: `frontend/src/features/examination/components/DoctorExaminationForm.tsx`
- Test: `frontend/src/features/examination/InitialAssessmentCard.test.tsx`

**Step 1: Write the failing test**
Verifikasi TTV dan riwayat alergi pasien dari nakes tampil di kartu ringkasan atas dokter.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Bangun kartu ringkasan nakes dan form pemeriksaan SOAP dokter.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add frontend/src/features/examination/
git commit -m "feat(frontend): build doctor consultation view with nurse assessment summary card"
```

---

### Task 19: API Input Tindakan Medis & Penguncian Tarif Billing Otomatis

**Files:**
- Create: `backend/models/ExaminationAction.php`
- Modify: `backend/models/Billing.php`
- Modify: `backend/controllers/api/ExaminationController.php`
- Test: `backend/tests/Functional/ActionBillingIntegrationTest.php`

**Step 1: Write the failing test**
Memverifikasi tarif tindakan medis terkunci dan terakumulasi ke `billings`.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan relasi `ExaminationAction` dan kalkulasi ulang billing.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/models/ExaminationAction.php backend/models/Billing.php
git commit -m "feat(api): link medical actions with tariff locking to billing aggregator"
```

---

### Task 20: API e-Resep Dokter dengan Validasi Ketersediaan Stok Real-time

**Files:**
- Create: `backend/models/Prescription.php`, `backend/models/PrescriptionItem.php`
- Create: `backend/controllers/api/PharmacyController.php`
- Test: `backend/tests/Functional/PrescriptionStockCheckTest.php`

**Step 1: Write the failing test**
Meresepkan obat melebihi stok ditolak dengan pesan: "Stok obat Paracetamol 500mg tidak mencukupi".

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Validasi stok real-time saat pembuatan resep.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/models/Prescription*.php backend/controllers/api/PharmacyController.php
git commit -m "feat(api): implement prescription creation with real-time stock pre-validation"
```

---

### Task 21: API Dispensing Obat Farmasi dengan Transaksi Atomik (`FOR UPDATE`)

**Files:**
- Modify: `backend/controllers/api/PharmacyController.php`
- Modify: `backend/models/Medicine.php`
- Test: `backend/tests/Functional/AtomicDispenseTest.php`

**Step 1: Write the failing test**
Memverifikasi pengurangan stok obat atomik dengan row lock dan log mutasi stok.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Bungkus proses dispensing dalam transaksi atomik dengan `SELECT ... FOR UPDATE`.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/controllers/api/PharmacyController.php backend/models/Medicine.php
git commit -m "feat(api): implement atomic pharmacy dispensing with for update row locking and stock logs"
```

---

### Task 22: Frontend UI Antrean Resep Farmasi & Penyerahan Obat

**Files:**
- Create: `frontend/src/features/pharmacy/components/PrescriptionQueueTable.tsx`
- Create: `frontend/src/features/pharmacy/components/PrescriptionDispenseModal.tsx`
- Test: `frontend/src/features/pharmacy/PrescriptionDispenseModal.test.tsx`

**Step 1: Write the failing test**
Verifikasi modal penyerahan obat menampilkan konfirmasi dan menangani error jika ada.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Bangun antarmuka antrean resep farmasi dan dialog dispensing.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add frontend/src/features/pharmacy/
git commit -m "feat(frontend): build pharmacy queue and atomic medicine dispensing interface"
```

---

### Task 23: Inisialisasi Service Fastify Node.js (`services/ancillary-service`)

**Files:**
- Create: `services/ancillary-service/package.json`
- Create: `services/ancillary-service/tsconfig.json`
- Create: `services/ancillary-service/src/index.ts`
- Create: `services/ancillary-service/src/config/db.ts`
- Create: `services/ancillary-service/Dockerfile`
- Test: `services/ancillary-service/tests/health.test.ts`

**Step 1: Write the failing test**
Uji endpoint `GET /health` mengembalikan status 200 `{ "status": "ok", "service": "ancillary-service" }`.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Setup proyek Fastify TypeScript dengan Zod validator dan connection pool PostgreSQL.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add services/ancillary-service/
git commit -m "feat(services): initialize fastify nodejs ancillary service with typescript, db pool, and dockerfile"
```

---

### Task 24: Integrasi Service Node.js ke Root `docker-compose.yml`

**Files:**
- Modify: `docker-compose.yml`

**Step 1: Review orchestration config**
Pastikan service `services` didefinisikan dengan port `4000:4000` dan network `app-network`.

**Step 2: Implement configuration**
Daftarkan service `services` pada `docker-compose.yml`.

**Step 3: Commit**
```bash
git add docker-compose.yml
git commit -m "feat(docker): register fastify ancillary service container on port 4000"
```

---

### Task 25: API Order Lab & Input Hasil Pengujian (Fastify Node.js)

**Files:**
- Create: `services/ancillary-service/src/routes/laboratory.ts`
- Create: `services/ancillary-service/src/controllers/laboratory.ts`
- Test: `services/ancillary-service/tests/laboratory.test.ts`

**Step 1: Write the failing test**
Uji membuat order lab dan menginput nilai hasil pengujian dengan flag `NORMAL` atau `ABNORMAL`.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan routes Fastify untuk laboratorium.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add services/ancillary-service/src/routes/laboratory.ts services/ancillary-service/src/controllers/laboratory.ts
git commit -m "feat(services): implement laboratory order and result rest apis in fastify"
```

---

### Task 26: Frontend UI Order Lab Dokter & Form Hasil Petugas Lab

**Files:**
- Create: `frontend/src/features/laboratory/components/LabOrderModal.tsx`
- Create: `frontend/src/features/laboratory/components/LabWorklistTable.tsx`
- Create: `frontend/src/features/laboratory/components/LabResultModal.tsx`
- Test: `frontend/src/features/laboratory/LabWorklistTable.test.tsx`

**Step 1: Write the failing test**
Verifikasi formulir pengisian hasil lab dan memberi penanda visual merah pada nilai abnormal.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Bangun modul laboratorium terpadu untuk dokter dan analis lab.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add frontend/src/features/laboratory/
git commit -m "feat(frontend): build lab ordering modal and technician result entry interface"
```

---

### Task 27: API Agregasi Biaya Tagihan Terpadu (Yii 2)

**Files:**
- Create: `backend/controllers/api/BillingController.php`
- Modify: `backend/models/Billing.php`
- Test: `backend/tests/Functional/BillingCalculationTest.php`

**Step 1: Write the failing test**
Memverifikasi endpoint billing merangkum pos registrasi, tindakan, obat, dan lab.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan `BillingController::actionSummary()`.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/controllers/api/BillingController.php backend/models/Billing.php
git commit -m "feat(api): implement unified billing cost aggregation endpoint"
```

---

### Task 28: API Pembayaran Kasir Atomik (Cash Full Payment / Cover BPJS)

**Files:**
- Create: `backend/models/BillingPayment.php`
- Modify: `backend/controllers/api/BillingController.php`
- Test: `backend/tests/Functional/AtomicPaymentTest.php`

**Step 1: Write the failing test**
Uji: Pembayaran Cash Full Payment dengan kembalian, pelunasan cover BPJS, penolakan pembayaran ganda dengan row lock `FOR UPDATE`.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan `actionPay()` di `BillingController.php` dengan transaksi atomik dan audit log `PAYMENT`.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/models/BillingPayment.php backend/controllers/api/BillingController.php
git commit -m "feat(api): implement cashier payment processing with cash full payment, bpjs cover, and row locking"
```

---

### Task 29: Frontend UI Kasir: Rincian Tagihan, Form Bayar & Kuitansi

**Files:**
- Create: `frontend/src/features/billing/components/BillingQueueTable.tsx`
- Create: `frontend/src/features/billing/components/PaymentModal.tsx`
- Create: `frontend/src/features/billing/components/PrintableInvoice.tsx`
- Test: `frontend/src/features/billing/PaymentModal.test.tsx`

**Step 1: Write the failing test**
Uji modal pembayaran: Menghitung kembalian otomatis saat input uang tunai, atau bebas biaya saat memilih BPJS.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Bangun antarmuka kasir dengan pemilihan metode bayar dan invoice siap cetak.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add frontend/src/features/billing/
git commit -m "feat(frontend): build cashier settlement interface with cash calculation, bpjs cover, and printable receipt"
```

---

### Task 30: Fastify High-Performance Analytics Aggregation API

**Files:**
- Create: `services/ancillary-service/src/routes/analytics.ts`
- Create: `services/ancillary-service/src/controllers/analytics.ts`
- Test: `services/ancillary-service/tests/analytics.test.ts`

**Step 1: Write the failing test**
Uji endpoint analitik `GET /api/v1/analytics/summary` mengembalikan metrik kunjungan, pendapatan tunai vs BPJS, dan obat terbanyak.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Tulis kueri agregat PostgreSQL yang dioptimasi di service Fastify.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add services/ancillary-service/src/routes/analytics.ts services/ancillary-service/src/controllers/analytics.ts
git commit -m "feat(services): implement fastify analytics aggregation endpoints with date filtering"
```

---

### Task 31: Frontend Dashboard Visual: KPI Cards, Filter Periode & Grafik

**Files:**
- Create: `frontend/src/features/dashboard/components/KpiMetricsRow.tsx`
- Create: `frontend/src/features/dashboard/components/VisitsByPolyChart.tsx`
- Create: `frontend/src/features/dashboard/components/RevenueSummaryCard.tsx`
- Create: `frontend/src/features/dashboard/components/TopMedicinesTable.tsx`
- Modify: `frontend/src/App.tsx`
- Test: `frontend/src/features/dashboard/KpiMetricsRow.test.tsx`

**Step 1: Write the failing test**
Verifikasi KPI card merender jumlah kunjungan, pendapatan, dan obat dengan format Rupiah.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Bangun dashboard operasional dengan filter tanggal interaktif dan grafik distribusi poli.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add frontend/src/features/dashboard/ frontend/src/App.tsx
git commit -m "feat(frontend): build operational and executive reporting dashboard with date filtering"
```

---

### Task 32: Migrasi Tabel Append-Only `audit_logs` dengan Indexing

**Files:**
- Create: `backend/migrations/m261123_000005_create_audit_logs_table.php`
- Test: `backend/tests/Unit/Models/AuditLogMigrationTest.php`

**Step 1: Write the failing test**
```php
<?php
namespace tests\Unit\Models;

use Codeception\Test\Unit;
use Yii;

class AuditLogMigrationTest extends Unit
{
    public function testAuditLogsTableStructure()
    {
        $schema = Yii::$app->db->schema->getTableSchema('audit_logs');
        $this->assertNotNull($schema, 'Tabel audit_logs harus ada di database');
        $this->assertArrayHasKey('user_id', $schema->columns);
        $this->assertArrayHasKey('action', $schema->columns);
        $this->assertArrayHasKey('module', $schema->columns);
        $this->assertArrayHasKey('details', $schema->columns);
        $this->assertArrayHasKey('created_at', $schema->columns);
    }
}
```

**Step 2: Run test to verify it fails**
Run: `php backend/yii test unit Unit/Models/AuditLogMigrationTest.php`
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan migrasi DDL `audit_logs` append-only dengan composite index pada `(user_id, created_at)` dan `(module, action)`.

**Step 4: Run test to verify it passes**
Run: `php backend/yii migrate --interactive=0 && php backend/yii test unit Unit/Models/AuditLogMigrationTest.php`
Expected: PASS

**Step 5: Commit**
```bash
git add backend/migrations/m261123_000005_create_audit_logs_table.php backend/tests/Unit/Models/AuditLogMigrationTest.php
git commit -m "feat(db): create immutable append-only audit_logs table with indexes"
```

---

### Task 33: Implementasi `AuditTrailBehavior` Yii2 dengan Sanitasi Kredensial

**Files:**
- Create: `backend/behaviors/AuditTrailBehavior.php`
- Create: `backend/models/AuditLog.php`
- Test: `backend/tests/Unit/AuditTrailSanitizationTest.php`

**Step 1: Write the failing test**
Uji sanitasi: Password, access_token, auth_key disaring menjadi `[REDACTED]` saat log ditulis.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan `AuditTrailBehavior` dan model `AuditLog` (ActiveRecord append-only).

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/behaviors/AuditTrailBehavior.php backend/models/AuditLog.php backend/tests/Unit/AuditTrailSanitizationTest.php
git commit -m "feat(security): implement audit trail behavior with automatic credential sanitization"
```

---

### Task 34: Service Backend Data Masking Pasien & Endpoint Unmask Data

**Files:**
- Create: `backend/components/PatientMasker.php`
- Modify: `backend/controllers/api/PatientController.php` (tambahkan `actionUnmask`)
- Test: `backend/tests/Functional/PatientMaskingTest.php`

**Step 1: Write the failing test**
Uji: Pasien terbaca dalam kondisi NIK ter-masking secara default; pemanggilan `actionUnmask` mencatat `UNMASK_DATA` ke `audit_logs` dan mengembalikan data asli.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan `PatientMasker.php` dan endpoint `actionUnmask($id)`.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/components/PatientMasker.php backend/controllers/api/PatientController.php backend/tests/Functional/PatientMaskingTest.php
git commit -m "feat(privacy): implement patient data masking by default and logged unmasking endpoint"
```

---

### Task 35: Frontend Komponen `<MaskedField />` dengan Ikon Mata & Guard

**Files:**
- Create: `frontend/src/components/ui/MaskedField.tsx`
- Test: `frontend/src/components/ui/MaskedField.test.tsx`

**Step 1: Write the failing test**
Uji komponen `MaskedField` menampilkan teks tersamar awal dan toggle interaktif dengan tombol Show/Hide.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan `MaskedField.tsx` dengan integrasi API unmask dan permission guard role pengguna.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add frontend/src/components/ui/MaskedField.tsx frontend/src/components/ui/MaskedField.test.tsx
git commit -m "feat(frontend): build reusable MaskedField component with interactive eye toggle and audit unmask"
```

---

### Task 36: Frontend Antarmuka Viewer Audit Trail (Khusus Administrator)

**Files:**
- Create: `frontend/src/features/audit/AuditTrailPage.tsx`
- Create: `frontend/src/features/audit/components/AuditTrailTable.tsx`
- Modify: `frontend/src/config/dashboard-menu.ts`
- Test: `frontend/src/features/audit/AuditTrailPage.test.tsx`

**Step 1: Write the failing test**
Verifikasi tabel audit trail merender kolom aktivitas, modul, username, IP, dan timestamp.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Bangun antarmuka audit trail viewer untuk Administrator dengan filter aksi dan tanggal.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add frontend/src/features/audit/ frontend/src/config/dashboard-menu.ts
git commit -m "feat(frontend): build administrator audit trail viewer with activity and date filters"
```

---

### Task 37: Komponen Form Input Standar (`FormField`) dengan Validasi Inline

**Files:**
- Create: `frontend/src/components/ui/FormField.tsx`
- Test: `frontend/src/components/ui/FormField.test.tsx`

**Step 1: Write the failing test**
Uji input merender pesan error inline di bawah field dengan `aria-invalid="true"`.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan `FormField.tsx` dengan styling border merah dan pesan error terhubung via `aria-describedby`.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add frontend/src/components/ui/FormField.tsx frontend/src/components/ui/FormField.test.tsx
git commit -m "feat(frontend): create standard FormField component with accessible inline validation errors"
```

---

### Task 38: Hook `useAppForm` dengan Pemetaan 422 & Preservasi Nilai Input

**Files:**
- Modify: `frontend/src/lib/api-client.ts`
- Create: `frontend/src/hooks/useAppForm.ts`
- Test: `frontend/src/hooks/useAppForm.test.ts`

**Step 1: Write the failing test**
Uji bahwa saat API mengembalikan error 422, nilai input pengguna tetap utuh dan error terpetakan ke field yang sesuai.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan hook `useAppForm` yang memisahkan `values` dan `fieldErrors`.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add frontend/src/lib/api-client.ts frontend/src/hooks/useAppForm.ts frontend/src/hooks/useAppForm.test.ts
git commit -m "feat(frontend): implement useAppForm hook with 422 api field error mapping and value preservation"
```

---

### Task 39: Provider `GlobalErrorModal` Terpusat (500, Network, 401, 403)

**Files:**
- Create: `frontend/src/components/layout/GlobalErrorModal.tsx`
- Create: `frontend/src/contexts/GlobalErrorContext.tsx`
- Modify: `frontend/src/lib/api-client.ts`
- Test: `frontend/src/components/layout/GlobalErrorModal.test.tsx`

**Step 1: Write the failing test**
Uji modal popup global muncul hanya untuk error 500, network, 401, 403, dan TIDAK pernah muncul untuk error validasi 422.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Implementasikan `GlobalErrorModal` dan integrasikan ke `apiClient`.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add frontend/src/components/layout/GlobalErrorModal.tsx frontend/src/contexts/GlobalErrorContext.tsx frontend/src/lib/api-client.ts
git commit -m "feat(frontend): implement central global error modal provider for 500, network, 401, and 403 errors"
```

---

### Task 40: Audit Keamanan RBAC Seluruh Endpoint & Route Guards 7 Peran

**Files:**
- Create: `backend/tests/Functional/RbacMatrixTest.php`
- Modify: `frontend/src/config/dashboard-menu.ts`
- Test: `backend/tests/Functional/RbacMatrixTest.php`

**Step 1: Write the failing test**
Uji proteksi peran: Akses tidak sah ke modul dokter, farmasi, kasir, atau audit trail ditolak dengan HTTP 403 Forbidden.

**Step 2: Run test to verify it fails**
Expected: FAIL

**Step 3: Write minimal implementation**
Konfigurasi `AccessControl` rule berbasis peran pada seluruh controller Yii 2 dan filter navigasi frontend.

**Step 4: Run test to verify it passes**
Expected: PASS

**Step 5: Commit**
```bash
git add backend/tests/Functional/RbacMatrixTest.php frontend/src/config/dashboard-menu.ts
git commit -m "feat(security): enforce comprehensive rbac rules across backend controllers and frontend navigation"
```

---

### Task 41: Ekspor Automated Postman Collection Test Suite v2.1.0

**Files:**
- Create: `docs/postman/SIMRS_Outpatient_Collection.json`
- Create: `docs/postman/SIMRS_Local_Environment.json`
- Create: `docs/POSTMAN_GUIDE.md`

**Step 1: Buat file collection Postman v2.1.0 lengkap**
Mencakup folder terstruktur untuk seluruh 9 modul inti + privasi unmasking:
1. `01-Auth`: Login 7 role pengguna.
2. `02-Master-Data`: CRUD Pasien, Dokter, Poli, Obat, Tindakan.
3. `03-Privacy-Masking`: Uji response masked dan unmask NIK dengan audit log.
4. `04-Registrasi-Antrean`: Pendaftaran pasien umum dan BPJS.
5. `05-Skrining-Nakes`: Input TTV & skrining alergi.
6. `06-Pemeriksaan-Dokter`: Input SOAP ICD-10 & tindakan medis.
7. `07-Farmasi-Atomic`: Buat e-resep, cek stok, dan dispense atomik.
8. `08-Laboratorium-Fastify`: Order lab & input hasil uji.
9. `09-Billing-Kasir-Atomic`: Pembayaran Cash kembalian & Cover BPJS.
10. `10-Audit-Trail`: Kueri jejak audit oleh admin.
11. `11-Dashboard-Analytics`: Pengujian agregat analitik.

**Step 2: Commit**
```bash
git add docs/postman/ docs/POSTMAN_GUIDE.md
git commit -m "docs(api): export postman test collection and runner guide including privacy unmasking tests"
```

---

### Task 42: Panduan Uji Manual End-to-End & Checklist Kepatuhan Sistem

**Files:**
- Create: `docs/MANUAL_TESTING_GUIDE.md`
- Modify: `docs/README.md`
- Modify: `README.md`

**Step 1: Susun skenario uji manual interaktif**
Skenario lengkap:
1. Pendaftaran Pasien (Umum & BPJS).
2. Uji Masking & Ikon Mata (Show/Hide NIK & Telepon Pasien).
3. Skrining Triage oleh Perawat.
4. Pemeriksaan Konsultasi Dokter (SOAP + ICD-10 + Tindakan + Resep + Lab).
5. Penginputan Hasil Lab oleh Petugas Laboratorium.
6. Telaah dan Penyerahan Obat oleh Farmasi (Verifikasi Mutasi Stok).
7. Pembayaran Kasir (Skenario Cash Kembalian dan Skenario Cover BPJS).
8. Uji Validasi Form (Pesan error inline di bawah field, nilai input tidak hilang).
9. Uji Global Error Modal (Simulasi Server Error 500 / Network Error).
10. Verifikasi Audit Trail oleh Admin (Mengecek jejak aktivitas unmasking dan transaksi).

**Step 2: Commit**
```bash
git add docs/MANUAL_TESTING_GUIDE.md docs/README.md README.md
git commit -m "docs: finalize end-to-end manual verification guide and documentation index"
```

---

## Pilihan Eksekusi (Execution Handoff)

Plan telah lengkap, utuh mencakup seluruh 9 modul inti studi kasus rawat jalan PLUS Audit Trail, Data Masking UU PDP, dan Form Error Handling terstandar, tersimpan di `docs/plans/2026-11-23-simrs-outpatient-implementation-plan.md`.

Tersedia dua opsi pendekatan eksekusi:

1. **Subagent-Driven (Sesi ini)** - Saya akan mengeksekusi rencana secara bertahap task demi task, memverifikasi setiap langkah, dan melakukan review berkala.
2. **Parallel Session (Terpisah)** - Anda dapat membuka sesi baru dan menjalankan eksekusi terarah menggunakan skill `executing-plans`.

Pendekatan mana yang ingin Anda pilih?
