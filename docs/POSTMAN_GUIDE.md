# Panduan Pengujian API Postman SIMRS Rawat Jalan

Repositori ini menyediakan koleksi Postman lengkap v2.1.0 untuk seluruh siklus pelayanan rawat jalan SIMRS, kepatuhan UU PDP, manajemen antrean, e-resep farmasi, serta billing kasir dengan dukungan otomatisasi Bearer Token melalui Postman Post-Response Script.

## 1. File Koleksi & Environment

File-file berikut berada di dalam folder `docs/postman/`:
1. **`SIMRS_Outpatient_Collection.json`**: Koleksi lengkap 11 folder modul REST API beserta skrip otomatisasi Bearer token.
2. **`SIMRS_Local_Environment.json`**: Variabel environment (`baseUrl`, `token`, `bearer_token`, dan token peran RBAC).

> Koleksi dan Environment juga telah disinkronkan secara langsung ke Postman Cloud Workspace **`denycode-app`**:
> - **Collection**: `Simple SIMRS` (UID: `12255985-6a9ce664-4f6b-4171-a1a5-b4b740152e8b`)
> - **Environment**: `SIMRS Local Environment` (UID: `12255985-375d59fe-5e24-4996-8c2d-f79deaf31081`)

---

## 2. Otomatisasi Pengisian Bearer Token (Auto-Auth)

Koleksi Postman ini dilengkapi dengan fitur otomatisasi pengisian token Bearer (**Postman Test / Post-Response Script**) pada tingkat koleksi (*collection root*) dan tingkat permintaan (*request level*):

1. **Pemicu Otomatis (Trigger)**:
   Setiap kali salah satu endpoint Login pada folder `02. Autentikasi & Manajemen Sesi (Auth)` dieksekusi dan mengembalikan status HTTP `200 OK`, skrip akan:
   - Mengekstrak token akses dari payload respons: `response.data.token`.
   - Menyimpan token ke variabel koleksi (`pm.collectionVariables`) dan variabel environment (`pm.environment`) pada key:
     - `{{bearer_token}}` (digunakan oleh Collection Auth default).
     - `{{token}}` (digunakan oleh endpoint umum, master data, pendaftaran, dan antrean).
   - Memetakan dan memperbarui token peran RBAC spesifik berdasarkan properti `data.user.role`:
     - Peran `admin` $\rightarrow$ menyetel variabel `{{admin_token}}`.
     - Peran `doctor` $\rightarrow$ menyetel variabel `{{doctor_token}}`.
     - Peran `nurse` $\rightarrow$ menyetel variabel `{{nurse_token}}`.
     - Peran `registration` $\rightarrow$ menyetel variabel `{{reg_token}}`.
     - Peran `pharmacist` $\rightarrow$ menyetel variabel `{{pharma_token}}`.
     - Peran `lab` $\rightarrow$ menyetel variabel `{{lab_token}}`.
     - Peran `cashier` $\rightarrow$ menyetel variabel `{{cashier_token}}`.

2. **Konsumsi Otomatis oleh Endpoint Lain**:
   - Seluruh endpoint yang membutuhkan Bearer token di koleksi (`03` s/d `11`) langsung terautentikasi tanpa perlu melakukan *copy-paste* token secara manual.
   - Header HTTP `Authorization: Bearer {{token}}` atau `Authorization: Bearer {{<role>_token}}` secara instan menggunakan token sesi terbaru.

---

## 3. Struktur Modul Koleksi Postman

1. **`01. Gateway & Health Check`**: Health check endpoint (`GET /api/v1/ping`).
2. **`02. Autentikasi & Manajemen Sesi (Auth)`**: Login 7 peran, profiling pengguna (`/me`), dan logout. Dilengkapi test script otomatisasi Bearer token.
3. **`03. Master Data - Pasien`**: CRUD data pasien, format otomatis No RM (`RM-YYYYMM-XXXXX`), dan unmasking data pribadi (`POST /api/v1/patients/:id/unmask`).
4. **`04. Master Data - Dokter, Poli & Jadwal`**: CRUD dokter, poliklinik, dan pencegahan overlap jadwal dokter.
5. **`05. Master Data - Tindakan Medis & Obat`**: CRUD tindakan medis, tarif, obat, serta penyesuaian stok obat (`/adjust-stock`).
6. **`06. Pendaftaran & Antrean Pasien`**: Pendaftaran kunjungan umum/BPJS, penomoran antrean poli otomatis, dan transisi lifecycle status.
7. **`07. Skrining & Asesmen Awal Nakes`**: Input tanda-tanda vital (TTV), skrining alergi, dan riwayat penyakit oleh perawat.
8. **`08. Pemeriksaan RME Dokter`**: Rekam medis elektronik SOAP & diagnosis ICD-10 yang diperluas secara atomik (`POST /api/v1/examinations` mendukung `actions`, `prescription_items`, `next_status`, dan rekalkulasi billing tunggal dalam 1 transaksi ACID), serta endpoint granular penambahan/penghapusan tindakan medis.
9. **`09. Farmasi & e-Resep`**: Pembuatan e-resep dokter dengan validasi ketersediaan stok real-time dan dispensing obat atomik (`FOR UPDATE`).
10. **`10. Kasir & Billing Terpadu`**: Agregasi rincian biaya tagihan terpadu dan pembayaran kasir atomik (Cash dengan perhitungan kembalian atau Bebas Biaya Cover BPJS).
11. **`11. Audit Trail & Log Keamanan (Admin Only)`**: Kueri jejak audit append-only dengan filter modul, aksi, dan penelusuran user ID.

---

## 4. Kredensial 7 Peran Pengguna (Default Seeder)

Semua akun default menggunakan password **`admin123`**:

| Peran | Username | Password | Variabel Token Postman | Default Token Seed |
|---|---|---|---|---|
| Administrator | `admin` | `admin123` | `{{admin_token}}` | `access_token_admin_00000000000001` |
| Petugas Pendaftaran | `pendaftaran` | `admin123` | `{{reg_token}}` | `access_token_reg_000000000000002` |
| Perawat Poliklinik | `perawat` | `admin123` | `{{nurse_token}}` | `access_token_nurse_00000000000003` |
| Dokter Spesialis | `dokter` | `admin123` | `{{doctor_token}}` | `access_token_doctor_0000000000004` |
| Apoteker / Farmasi | `apotek` | `admin123` | `{{pharma_token}}` | `access_token_pharma_0000000000005` |
| Analis Laboratorium | `lab` | `admin123` | `{{lab_token}}` | `access_token_lab_000000000000006` |
| Kasir Pembayaran | `kasir` | `admin123` | `{{cashier_token}}` | `access_token_cashier_000000000007` |

---

## 5. Menjalankan Uji Otomatis dengan Newman CLI

Untuk menjalankan seluruh rangkaian pengujian dari terminal:

```bash
# Jalankan seluruh koleksi menggunakan environment lokal
npx newman run docs/postman/SIMRS_Outpatient_Collection.json -e docs/postman/SIMRS_Local_Environment.json
```
