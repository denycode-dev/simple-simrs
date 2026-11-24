# Panduan Pengujian API Postman SIMRS Rawat Jalan

Repositori ini menyediakan koleksi Postman lengkap v2.1.0 untuk seluruh siklus pelayanan rawat jalan SIMRS, kepatuhan UU PDP, manajemen antrean, e-resep farmasi, serta billing kasir.

## 1. File Koleksi & Environment

File-file berikut berada di dalam folder `docs/postman/`:
1. **`SIMRS_Outpatient_Collection.json`**: Koleksi lengkap 11 folder modul REST API.
2. **`SIMRS_Local_Environment.json`**: Variabel environment (`baseUrl` dan token autentikasi Bearer untuk 7 peran pengguna).

## 2. Struktur Modul Koleksi Postman

1. **`01. Gateway & Health Check`**: Health check endpoint (`GET /api/v1/ping`).
2. **`02. Autentikasi & Manajemen Sesi (Auth)`**: Login 7 peran, profiling pengguna (`/me`), dan logout.
3. **`03. Master Data - Pasien`**: CRUD data pasien, format otomatis No RM (`RM-YYYYMM-XXXXX`), dan unmasking data pribadi (`POST /api/v1/patients/:id/unmask`).
4. **`04. Master Data - Dokter, Poli & Jadwal`**: CRUD dokter, poliklinik, dan pencegahan overlap jadwal dokter.
5. **`05. Master Data - Tindakan Medis & Obat`**: CRUD tindakan medis, tarif, obat, serta penyesuaian stok obat (`/adjust-stock`).
6. **`06. Pendaftaran & Antrean Pasien`**: Pendaftaran kunjungan umum/BPJS, penomoran antrean poli otomatis, dan transisi lifecycle status.
7. **`07. Skrining & Asesmen Awal Nakes`**: Input tanda-tanda vital (TTV), skrining alergi, dan riwayat penyakit oleh perawat.
8. **`08. Pemeriksaan RME Dokter`**: Rekam medis elektronik SOAP, diagnosis ICD-10, dan penambahan tindakan medis dengan penguncian tarif.
9. **`09. Farmasi & e-Resep`**: Pembuatan e-resep dokter dengan validasi ketersediaan stok real-time dan dispensing obat atomik (`FOR UPDATE`).
10. **`10. Kasir & Billing Terpadu`**: Agregasi rincian biaya tagihan terpadu dan pembayaran kasir atomik (Cash dengan perhitungan kembalian atau Bebas Biaya Cover BPJS).
11. **`11. Audit Trail & Log Keamanan (Admin Only)`**: Kueri jejak audit append-only dengan filter modul, aksi, dan penelusuran user ID.

## 3. Menjalankan Uji Otomatis dengan Newman CLI

Untuk menjalankan seluruh rangkaian pengujian dari terminal:

```bash
# Jalankan seluruh koleksi menggunakan environment lokal
npx newman run docs/postman/SIMRS_Outpatient_Collection.json -e docs/postman/SIMRS_Local_Environment.json
```

## 4. Kredensial 7 Peran Pengguna (Token Seed)

| Peran | Username | Password | Bearer Access Token |
|---|---|---|---|
| Administrator | `admin` | `admin123` | `access_token_admin_00000000000001` |
| Petugas Pendaftaran | `pendaftaran` | `reg123` | `access_token_reg_000000000000002` |
| Perawat Poliklinik | `perawat` | `nurse123` | `access_token_nurse_00000000000003` |
| Dokter Spesialis | `dokter` | `doctor123` | `access_token_doctor_0000000000004` |
| Apoteker / Farmasi | `apotek` | `pharma123` | `access_token_pharma_0000000000005` |
| Analis Laboratorium | `laboratorium` | `lab123` | `access_token_lab_000000000000006` |
| Kasir Pembayaran | `kasir` | `cashier123` | `access_token_cashier_000000000007` |
