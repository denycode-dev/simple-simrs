# Simple SIMRS

This document provides the project overview, system architecture, core clinical modules, setup commands, and service references for **Simple SIMRS (Sistem Informasi Manajemen Rumah Sakit)**. You can launch the full multi-tier containerized environment using Docker Compose, access the React frontend, Yii 2 core backend, Node.js Fastify ancillary service, and navigate dedicated subproject guides.

---

## Project Overview

**Simple SIMRS** is a modern, modular, open-source Hospital Information Management System designed for outpatient clinical healthcare workflows (*Pelayanan Rawat Jalan*). Built with **Spec-Driven Development (SDD)** principles, the application strictly adheres to Indonesian clinical data standards (SOAP notes, ICD-10 diagnosis) and Personal Data Protection regulations (**UU No. 27 Tahun 2022 / UU PDP**) featuring interactive data masking and append-only audit trail logging.

The repository uses a hybrid multi-tier micro-services architecture composed of four coordinated services:

- **Frontend Client**: Built with **React 19**, **Vite 8**, and **TypeScript 6**, styled using Meta's **Astryx Design System** (`@astryxdesign/core`, `@astryxdesign/theme-neutral`, `@stylexjs/stylex`) with WCAG AAA light-mode compliance, accessible inline form validation, and role-based view routing.
- **Core Backend Service**: Built with the **Yii 2** framework running on **PHP 8.4** and Apache, managing clinical domain logic, REST API endpoints (`/api/v1/*`), atomic ACID transactions with row-level locking (`SELECT ... FOR UPDATE`), and security behaviors.
- **Ancillary & Analytics Service (`services/`)**: High-performance microservice built on **Node.js 22**, **Fastify 5**, and **pg.Pool** with **Zod** schema validation, handling laboratory order tracking and parallel aggregation for dashboard analytics.
- **Relational Database**: Powered by **PostgreSQL 17** with 20 relational tables, B-tree foreign key indexing, composite indexes, integrity constraints, and an append-only audit log.
- **Container Orchestration**: Managed via **Docker Compose v2** on an isolated bridge network (`app-network`).

---

## Integrated Outpatient Clinical Flow

```text
[1. Pendaftaran Pasien & Antrean]
   ├── Pendaftaran kunjungan umum vs BPJS & penerbitan nomor antrean otomatis
   └── Penyamaran identitas otomatis (NIK: 3201************ [Show/Hide])
            │
            ▼
[2. Skrining Awal Keperawatan (Triage)]
   ├── Tanda-Tanda Vital (TTV): Tensi, Nadi, Suhu, RR & Antropometri (BB, TB, BMI)
   └── Anamnesis awal: Keluhan utama, riwayat alergi, dan riwayat penyakit
            │
            ▼
[3. Konsultasi & Rekam Medis Dokter (RME)]
   ├── Pemeriksaan fisik spesifik & diagnosis terstruktur ICD-10 (Primer & Sekunder)
   ├── Input tindakan medis poliklinik (tarif otomatis terkunci ke billing)
   │        │
   │        ├───► (Kondisional) [4. Laboratorium (Fastify Node.js Service)]
   │        │        └── Order lab dokter -> Verifikasi & hasil uji lab analis
   │        │
   │        └───► (Kondisional) [5. Farmasi & Resep Obat (Yii 2 Atomic Transaction)]
   │                 └── Input e-resep -> Telaah apoteker -> Dispense obat (Row-lock)
   │
   ▼
[6. Kasir & Pembayaran Terpadu]
   ├── Konsolidasi biaya tagihan (Pendaftaran + Tindakan + Lab + Obat)
   ├── Skema Tunai (Full payment & hitung kembalian) ATAU Klaim BPJS (Rp 0 Out-of-Pocket)
   └── Transaksi atomik anti-double payment & cetak kuitansi resmi
            │
            ▼
[7. Dashboard Analitik & Audit Trail (UU PDP)]
   ├── Metrik kunjungan, sebaran poli, ringkasan pendapatan tunai vs BPJS, utilisasi obat
   └── Penelusuran audit log append-only aktivitas pengguna klinis
```

---

## Core System Modules

1. **Master Data Management**: Patients (16-digit NIK, auto-formatted `RM-YYYYMM-XXXXX`, UU PDP masking), Doctors & Nurses, Polyclinics, Overlap-protected Doctor Schedules, Medical Actions & Tariffs, Medicines (Stock tracking & mutation logs).
2. **Registration & Queueing**: Outpatient visit registration, General vs BPJS coverage, automated daily queue numbering per polyclinic, and live queue board.
3. **Nursing Screening / Triage**: Vital signs (Blood Pressure, Heart Rate, Respiratory Rate, Body Temperature), anthropometry (Height, Weight, BMI), allergies, and anamnesis.
4. **Doctor Clinical Examination & RME**: Electronic Medical Record with SOAP documentation, physical examination, ICD-10 diagnostic codes, medical actions, e-prescriptions, and laboratory order dispatch.
5. **Laboratory Support (Ancillary Service)**: Dedicated Fastify service managing doctor laboratory orders, worklists, specimen progress, and normal/abnormal result reporting.
6. **Pharmacy & e-Prescription**: Real-time stock pre-validation, pharmacist prescription review, atomic dispensing with row-level locking (`SELECT ... FOR UPDATE`), and stock mutation logging.
7. **Integrated Cashier & Billing**: Centralized invoice consolidation, Cash settlement with automatic change calculation, BPJS 100% cover (Rp 0 out-of-pocket), row-locked double-submit protection, and printable receipts.
8. **Dashboard & Analytics**: Parallel aggregation for outpatient visit counts, polyclinic performance, cash vs BPJS revenue breakdown, and pharmacy inventory warnings.
9. **Role-Based Access Control (RBAC)**: 7 distinct healthcare personas with centralized route guarding and dynamic navigation filtering.
10. **Data Privacy & Audit Trail (UU PDP No. 27/2022)**: Sensitive data masking by default with audited interactive unmasking, and an append-only audit trail recording clinical and financial operations.

---

## Repository Layout

The repository organizes source code, documentation, microservices, and container definitions into distinct directories:

```text
.
├── backend/            # Yii 2 core REST API service (PHP 8.4, Apache, PostgreSQL 17)
├── docker/             # Supplemental container configuration files
├── docs/               # System specifications, architecture docs, Postman suite & plans
│   ├── plans/          # Implementation plans and development milestones
│   └── postman/        # Postman collection & environment for API automated testing
├── frontend/           # React 19 web application (Vite 8, Astryx Design System, StyleX)
├── services/           # Ancillary & Analytics service (Node.js 22, Fastify 5, PostgreSQL)
├── .env.example        # Environment variable template
├── docker-compose.yml  # Multi-container orchestration definition (4 services)
└── README.md           # Root repository overview and setup guide
```

---

## System Requirements

Prepare your local machine with the following tools before running the project:

- **Containerized Execution (Recommended)**: Docker Engine version 24.0 or newer and Docker Compose v2.
- **Direct Host Execution (Optional)**: 
  - Node.js 22 or newer (Frontend & Ancillary Service)
  - PHP 8.4 with PostgreSQL PDO extension (`pdo_pgsql`) and Composer 2 (Backend)
  - PostgreSQL 17 (Database)

---

## Getting Started with Docker Compose

Launch the complete multi-service application stack with the following steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/simple-simrs.git
   cd simple-simrs
   ```

2. **Create your environment configuration**:
   Copy the example environment file to `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Configure environment secrets**:
   Ensure `.env` contains valid credentials:
   ```env
   APP_ENV=development
   COOKIE_VALIDATION_KEY=your_generated_32_byte_secret_key
   POSTGRES_DB=simrs_db
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_secure_password
   DB_HOST=postgres
   DB_PORT=5432
   DB_NAME=simrs_db
   DB_USER=postgres
   DB_PASSWORD=your_secure_password
   ```

4. **Start all service containers**:
   ```bash
   docker compose up -d
   ```

5. **Run database migrations and seeders**:
   Execute migrations and seed initial master data and 7 RBAC accounts:
   ```bash
   # Run core Yii2 migrations
   docker compose exec backend php yii migrate --interactive=0

   # Seed master data & default demo accounts
   docker compose exec backend php yii seed

   # Run ancillary service database index optimizations
   docker compose exec services npm run db:migrate
   ```

6. **Verify container health**:
   ```bash
   docker compose ps
   ```

---

## Application Service Endpoints

Once containers finish initializing, access the active endpoints below:

| Service | Target URL | Description |
|---|---|---|
| **Frontend Client** | `http://localhost:5173` | React 19 SPA (Astryx Design System) |
| **Backend Core API** | `http://localhost:8080` | Yii 2 web & REST API (`/api/v1/*`) |
| **Ancillary & Analytics** | `http://localhost:4000` | Fastify Node.js service (Lab & Analytics) |
| **PostgreSQL Database** | `localhost:5432` | PostgreSQL 17 relational database instance |

---

## Demo Accounts & RBAC Credentials

The database seeder populates 7 distinct role-based accounts to verify each clinical and administrative workflow. All default accounts use the password **`admin123`**:

| Role | Username | Password | Full Name / Healthcare Persona | Accessible Modules |
|---|---|---|---|---|
| **Administrator** | `admin` | `admin123` | Administrator Sistem | Full system access, Master Data, Audit Trail, Dashboard |
| **Registration** | `pendaftaran` | `admin123` | Petugas Pendaftaran | Pendaftaran Pasien, Live Board Antrean, Master Pasien |
| **Nurse** | `perawat` | `admin123` | Perawat Rawat Jalan | Skrining Awal & Triage Nakes, Data Pasien |
| **Doctor** | `dokter` | `admin123` | dr. Budi Santoso, Sp.PD | Konsultasi RME, Diagnosa ICD-10, Tindakan, e-Resep, Order Lab |
| **Pharmacist** | `apotek` | `admin123` | Petugas Farmasi | Antrean e-Resep, Dispensing Obat, Master Obat & Stok |
| **Lab Analyst** | `lab` | `admin123` | Analis Laboratorium | Laboratorium Klinis, Input & Verifikasi Hasil Lab |
| **Cashier** | `kasir` | `admin123` | Petugas Kasir | Kasir & Pembayaran, Faktur Tagihan, Kuitansi Cetak |

---

## API Testing & Postman Suite

The repository includes a comprehensive Postman test suite in `docs/postman/` covering all 13 REST API module folders:

- **Collection**: `docs/postman/Simple SIMRS.postman_collection.json`
- **Environment**: `docs/postman/SIMRS.postman_environment.json`
- **Auto-Auth Script**: Automatically captures access tokens upon login and populates `{{bearer_token}}` and role-specific tokens (`{{admin_token}}`, `{{doctor_token}}`, etc.) for subsequent calls.

Run the test suite using Newman CLI:
```bash
npx newman run "docs/postman/Simple SIMRS.postman_collection.json" -e "docs/postman/SIMRS.postman_environment.json"
```

---

## Project Documentation Index

Explore detailed documentation for each layer of the application:

- [System Requirements Specification (SPECIFICATION.md)](docs/SPECIFICATION.md): Functional specification for all 10 clinical modules, UU PDP rules, and database schema dictionary.
- [System Architecture (ARCHITECTURE.md)](docs/ARCHITECTURE.md): Hybrid multi-tier design, ACID transaction row-locking, and validation pipelines.
- [Postman API Guide (POSTMAN_GUIDE.md)](docs/POSTMAN_GUIDE.md): Complete guide for executing REST API endpoints, token automation, and Newman CLI runs.
- [Outpatient Implementation Plan (docs/plans/)](docs/plans/2026-11-23-simrs-outpatient-implementation-plan.md): 12-phase granular implementation roadmap and verification milestones.
- [Frontend Documentation (frontend/README.md)](frontend/README.md): Architecture, feature modules, and component patterns.
- [Frontend Agent Guide (frontend/AGENTS.md)](frontend/AGENTS.md): Design system rules and Astryx component conventions.
- [Design System Specification (frontend/DESIGN.md)](frontend/DESIGN.md): Visual tokens, WCAG AAA standards, color palette, and layout guidelines.
- [Backend Documentation (backend/README.md)](backend/README.md): Yii 2 configuration, database connection, testing suites (Codeception, PHPStan), and CLI commands.

---

## License

This project is licensed under open-source terms. See the individual subproject directories for third-party component licenses.
