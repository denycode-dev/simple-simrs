# Dokumentasi Proyek Simple SIMRS (Spec-Driven Development)

Selamat datang di direktori dokumentasi **Simple SIMRS (Sistem Informasi Manajemen Rumah Sakit)**. Repositori ini menerapkan metodologi **Spec-Driven Development (SDD)** terpadu, di mana seluruh perancangan sistem dan kode mengacu pada spesifikasi kebutuhan klinis terstruktur, arsitektur multi-tier berkinerja tinggi, kepatuhan pelindungan data pribadi (UU PDP No. 27/2022), serta rencana implementasi berbasis pengujian (*Test-Driven Development*).

---

## 📑 Indeks Dokumen

Berikut adalah dokumen panduan, spesifikasi, dan rencana kerja utama:

1. **[Spesifikasi Kebutuhan Sistem (SPECIFICATION.md)](file:///c:/new-work-area/personal/inova-medika/docs/SPECIFICATION.md)**
   * **Seluruh 9 Modul Inti Pelayanan Rawat Jalan Lengkap**:
     * Modul 1: Pengelolaan Master Data (Pasien NIK 16 digit & No RM, Dokter & Nakes, Poli, Jadwal Praktik anti-bentrok, Tindakan Medis & Tarif, Obat, Stok & Harga dengan audit mutasi stok).
     * Modul 2: Pendaftaran & Antrean Pasien (Cari No RM/NIK, Kunjungan Umum vs BPJS, nomor antrean otomatis harian, status antrean, riwayat kunjungan).
     * Modul 2.5: Skrining Awal Keperawatan / Triage (Perawat periksa TTV [Tensi, Nadi, Suhu, RR], Antropometri [BB, TB], Keluhan Utama, Riwayat Alergi & Riwayat Penyakit).
     * Modul 3: Pemeriksaan Klinis & Rekam Medis Dokter (Antrean dokter, kartu info awal nakes, pemeriksaan fisik spesifik, diagnosis ICD-10 utama & sekunder, catatan SOAP, riwayat kunjungan).
     * Modul 4: Pengelolaan Tindakan Medis (Dokter pilih tindakan, tarif otomatis terkunci, multi-tindakan per kunjungan, masuk billing).
     * Modul 5: Farmasi & Resep Obat (Dokter input e-resep, pre-validasi stok real-time, apoteker telaah resep, penyerahan obat dengan pemotongan stok atomik `SELECT ... FOR UPDATE` dan log mutasi).
     * Modul 6: Pemeriksaan Penunjang Laboratorium (Dokter order lab, analis lab input hasil [normal/abnormal] via Node.js Fastify service di `services/ancillary-service`, hasil tampil di RME dokter).
     * Modul 7: Billing & Kasir Pembayaran (Konsolidasi biaya pendaftaran + tindakan + lab + obat, skema Tunai Full Payment dengan kembalian otomatis ATAU Ditanggung Penuh BPJS [Rp 0 out-of-pocket], proteksi transaksi ganda via row-lock, invoice & kuitansi cetak).
     * Modul 8: Dashboard & Laporan Analitik (Fastify Node.js high-performance aggregation, metrik kunjungan, per poli, ringkasan pendapatan tunai vs BPJS, rekap obat terbanyak, filter periode tanggal).
     * Modul 9: Pengelolaan Pengguna & Hak Akses (RBAC 7 Peran: Admin, Pendaftaran, Perawat, Dokter, Farmasi, Lab, Kasir).
   * **DITAMBAHKAN - Modul 10 & Data Privacy**:
     * Modul 10: Audit Trail & Pelindungan Data Pribadi (UU No. 27 Tahun 2022 / UU PDP): Pencatatan otomatis aktivitas penting (*login, logout, create, update, delete, unmask, dispense, payment*) tanpa menyimpan password/token plaintext. Tabel *append-only* anti-manipulasi.
     * Mekanisme Data Masking: Data sensitif pasien (NIK, Telepon, Alamat, Email, No BPJS) disamarkan (*masked*) secara default. Ikon interaktif *Show/Hide (Eye/EyeOff)* untuk membuka data asli setelah konfirmasi hak akses dan tercatat di audit log.
   * **DITAMBAHKAN - Standarisasi Form Validation & Error Handling**:
     * Error validasi frontend dan backend (422) ditampilkan langsung secara inline di bawah field terkait.
     * Nilai input pengguna dipertahankan (*input persistence*) agar tidak hilang saat terjadi kesalahan validasi.
     * Visual error state yang jelas (`aria-invalid="true"`, border merah, dan pesan aksesibel).
     * Global Error Handling: Dialog modal terpusat *hanya* digunakan untuk error sistemik non-field (500 Server Error, Network Disconnected, 401 Session Expired, 403 Forbidden).
   * **Kamus Skema Database PostgreSQL 17**: 20 tabel relasional dengan constraint integritas data, foreign keys, audit logs, dan composite indexes.

2. **[Desain Arsitektur Sistem (ARCHITECTURE.md)](file:///c:/new-work-area/personal/inova-medika/docs/ARCHITECTURE.md)**
   * **Arsitektur Hybrid Multi-Tier**:
     * **Frontend**: React 19 SPA (Vite + TypeScript) mengadopsi standar **`/vercel-react-best-practices`**, *Inline Field Error Architecture*, dan *Astryx Design System*.
     * **Backend Utama**: Yii 2 (PHP 8.4) mengadopsi kaidah **`/yii2-core`**, *Sanitized Audit Trail Behavior*, dan *Patient Masking Service*.
     * **Backend Services / API**: Node.js 22 menggunakan framework **Fastify** di folder `services/ancillary-service` mengadopsi kaidah **`/nodejs-best-practices`** (Layered architecture, Zod validation, pg.Pool).
     * **Basis Data**: PostgreSQL 17 mengadopsi panduan **`/postgresql-optimization`** (B-Tree on Foreign Keys, Composite indexes, Append-only Audit Table).
   * **Mitigasi Race Condition & Transaksi Atomik (ACID)**:
     * Pengurangan stok obat farmasi dilindungi *row-level lock* (`SELECT ... FOR UPDATE`) dan pencatatan audit log mutasi.
     * Pembayaran kasir dilindungi *row-level lock* untuk mencegah *double payment* / *double invoice submit*.
   * **Pipa Validasi Form & Modal Error Global**: Diagram alur penanganan error field-level vs modal dialog terpusat.
   * **Orkestrasi Kontainer**: Konfigurasi port, healthcheck, dan jaringan bridge Docker Compose (`app-network`).

3. **[Rencana Implementasi Terarah (Implementation Plan)](file:///c:/new-work-area/personal/inova-medika/docs/plans/2026-11-23-simrs-outpatient-implementation-plan.md)**
   * Disusun menggunakan standar skill **`writing-plans`**.
   * Terdiri dari 12 Fase dan 42 Tugas Implementasi granular (*bite-sized tasks*).
   * Mempertahankan **seluruh 9 modul inti klinis & transaksi SIMRS** di Fase 1 s/d 9, diikuti oleh Fase 10 (Audit Trail & Masking UU PDP), Fase 11 (Form Validation Inline & Global Error Modal), dan Fase 12 (Finalisasi RBAC & Postman Suite).
   * Setiap tugas dilengkapi file target, failing test TDD, perintah uji, implementasi minimal, dan git commit.
   * Meliputi seeder data awal lengkap (7 role akun, dokter, poli, jadwal, tindakan, tarif, obat, stok).

---

## 🚀 Alur Pelayanan Rawat Jalan Terintegrasi

```
[1. Pendaftaran Pasien]
   └── Input Data Pasien, Pilih Poli & Dokter, Pilih Penjamin (Umum / BPJS)
   └── Identitas Pasien Tampil Ter-masking Secara Default (NIK: 3201************ [Show])
   └── Terbitkan Karcis Antrean (Status: WAITING_NURSE)
            │
            ▼
[2. Skrining Awal Keperawatan (Ruang Triage)]
   └── Perawat periksa: Umur, JK, BB, TB, Tensi, Nadi, Suhu, RR
   └── Anamnesis Awal: Keluhan Utama, Riwayat Alergi & Riwayat Penyakit
   └── Simpan Asesmen (Status Kunjungan -> WAITING_DOCTOR)
            │
            ▼
[3. Pemeriksaan Konsultasi Dokter (Poliklinik)]
   └── Dokter melihat Kartu Informasi Awal Nakes (TTV & Alergi)
   └── Pemeriksaan Fisik Spesifik & Diagnosis ICD-10 Utama/Sekunder
   └── Input Tindakan Medis (Tarif Otomatis Terkunci ke Billing)
            │
            ├───► (Kondisional) [4. Penunjang Lab (Fastify Node.js Service)]
            │        └── Dokter Order Lab -> Petugas Lab Input Hasil Uji (Normal/Abnormal)
            │
            └───► (Kondisional) [5. Farmasi & Resep Obat (Yii 2 Atomic Transaction)]
                     └── Dokter Input e-Resep (Pre-validasi Stok Real-time)
                     └── Apoteker Telaah & Serahkan Obat (Stok Otomatis Terpotong & Tercatat di Log Mutasi)
            │
            ▼
[6. Kasir & Pembayaran Terpadu]
   ├── Skenario Tunai: Full Payment (Input Uang Diterima & Hitung Kembalian Otomatis)
   └── Skenario BPJS: Bebas Biaya Out-of-Pocket (Rp 0 / Klaim BPJS 100%)
   └── Transaksi Atomik (Cegah Transaksi Ganda) & Cetak Kuitansi / Faktur Resmi (Status: COMPLETED)
            │
            ▼
[7. Monitoring Dashboard & Laporan Analitik]
   ├── Agregasi Kunjungan, Pendapatan Tunai/BPJS, Utilisasi Obat, dan Kinerja Poliklinik
   └── Monitoring Audit Trail Aktivitas Pengguna (Khusus Administrator)
```
