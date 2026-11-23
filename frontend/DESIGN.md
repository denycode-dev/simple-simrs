# Design System: SIMRS Inova Medika
**Project ID:** inova-medika-simrs

---

## 1. Visual Theme & Atmosphere

### 1.1 Aesthetic Philosophy: Clinical Precision & Humane Clarity
SIMRS Inova Medika dirancang sebagai antarmuka sistem informasi manajemen rumah sakit kelas enterprise yang mengedepankan **Clinical Precision, Airy Clarity, Authoritative Calm, dan Humane Accessibility**. 

Di lingkungan fasilitas kesehatan dan rumah sakit, tenaga medis (dokter, perawat, apoteker, dan staf administrasi) memproses data kritis dalam volume tinggi di bawah tekanan waktu yang ketat. Oleh karena itu, antarmuka ini mengadopsi prinsip:
- **Light Mode Only (Strict)**: Menolak distraksi mode gelap untuk menjamin keterbacaan data numerik, status triage, dan riwayat pasien yang jernih di bawah pencahayaan ruangan medis.
- **Zero Visual Clutter**: Mengeliminasi efek visual dekoratif berlebih (seperti gradien neon, skeuomorphism berat, atau border tebal yang tidak fungsional).
- **High Data Scannability**: Informasi penting (No. RM, DPJP, Status Layanan, Diagnosa Utama) dapat dipindai dalam hitungan detik melalui ritme tipografi dan hierarki warna yang presisi.

---

## 2. Color Palette & Roles

Semua warna dalam sistem didefinisikan secara semantik melalui variabel CSS global pada [src/index.css](file:///c:/new-work-area/personal/inova-medika/frontend/src/index.css) dan tema netral Astryx Design. Seluruh pasangan warna teks dan latar belakang dijamin memenuhi rasio kontras **WCAG 2.2 AA (minimal 4.5:1 untuk teks normal, 3:1 untuk teks besar)**.

| Nama Deskriptif | Hex Code & Token CSS | Peran Fungsional |
| :--- | :--- | :--- |
| **Slate Command Dark** | `#0f172a` (`var(--color-text-main)`) | Teks utama, judul halaman, label tombol penting, dan nilai data tabel. Kontras 12.6:1 terhadap putih. |
| **Subdued Muted Slate** | `#64748b` (`var(--color-text-secondary)`) | Teks sekunder, nama dokter penanggung jawab, timestamp, dan label header tabel. Kontras 4.6:1. |
| **Whisper Boundary Gray** | `#94a3b8` (`var(--color-text-muted)`) | Helper text, placeholder input, dan ikon status non-aktif. |
| **Deep Clinical Teal** | `#0d9488` (`var(--color-primary)`) | Warna aksen brand medis utama, tombol aksi primer (*Primary Call-to-Action*), dan indikator aktif. |
| **Clinical Teal Hover** | `#0f766e` (`var(--color-primary-hover)`) | State hover dan fokus pada tombol aksi primer. |
| **Soft Medical Cyan Wash** | `#f0fdfa` (`var(--color-primary-light)`) | Latar belakang menu aktif sidebar, tag nomor rekam medis, dan highlight baris terpilih. |
| **Cyan Accent Border** | `#ccfbf1` (`var(--color-primary-border)`) | Garis tepi halus pada tag rekam medis dan badge aktif. |
| **Crisp Sterile White** | `#ffffff` (`var(--color-surface)`) | Latar belakang kartu (*Card*), topbar header, modal rekam medis, dan sel data tabel. |
| **Calm Clinical Canvas** | `#f8fafc` (`var(--color-bg)`) | Latar belakang kanvas aplikasi, sidebar navigasi, dan lajur breadcrumb. |
| **Clean Boundary Gray** | `#e2e8f0` (`var(--color-border)`) | Garis pembatas kartu, batas sel tabel, divider form, dan separator layout. |
| **Subdued Header Fill** | `#f1f5f9` (`var(--color-surface-hover)`) | Latar belakang sticky header tabel, baris tabel saat hover, dan header kartu. |
| **Vitality Emerald** | `#16a34a` (`var(--color-success)`) | Teks status pasien "Selesai" (pulang/sembuh), banner sukses, dan indikator koneksi online. |
| **Soft Emerald Wash** | `#dcfce7` (`var(--color-success-light)`) | Latar belakang pill badge status "Selesai". |
| **Urgent Care Amber** | `#d97706` (`var(--color-warning)`) | Teks status "Rawat Inap", badge peringatan klinis, dan stok obat menipis. |
| **Soft Amber Wash** | `#fef3c7` (`var(--color-warning-light)`) | Latar belakang pill badge status "Rawat Inap". |
| **Emergency Ruby** | `#dc2626` (`var(--color-error)`) | Teks status pasien "IGD" (gawat darurat), aksi destruktif (hapus/batal), dan pesan validasi gagal. |
| **Soft Ruby Wash** | `#fee2e2` (`var(--color-error-light)`) | Latar belakang pill badge status "IGD". |
| **Diagnostic Sapphire** | `#2563eb` (`var(--color-info)`) | Teks status pasien "Rawat Jalan" dan pesan informasi layanan medis. |
| **Soft Sapphire Wash** | `#dbeafe` (`var(--color-info-light)`) | Latar belakang pill badge status "Rawat Jalan". |

---

## 3. Typography Rules

### 3.1 Tipografi Utama & Monospace Medis
- **Font Antarmuka Primer**: **Figtree** (`font-family: 'Figtree', sans-serif`), dimuat melalui paket tema resmi `@astryxdesign/theme-neutral`. Figtree memberikan proporsi geometris sans-serif yang modern, bersih, dan sangat mudah dibaca pada layar beresolusi tinggi maupun rendah.
- **Font Kode Medis**: **Monospace** (`font-family: monospace`), digunakan secara khusus untuk Nomor Rekam Medis (No. RM), kode diagnosa ICD-10, kode tindakan ICD-9-CM, dan format waktu standar rumah sakit agar karakter numerik memiliki lebar seragam (*tabular figures*).

### 3.2 Hierarki & Bobot Teks
- **Judul Halaman (Page Titles)**: `20px - 24px` | Bold (`700`) | Letter-spacing `-0.02em` | Warna: Slate Command Dark (`#0f172a`).
- **Judul Bagian & Modal (Section/Modal Titles)**: `16px - 18px` | SemiBold (`600`) | Letter-spacing `-0.01em` | Warna: Slate Command Dark (`#0f172a`).
- **Header Kolom Tabel (Table Headers)**: `12px - 13px` | SemiBold (`600`) | Text-transform: `none` / sedikit tracking `0.02em` | Warna: Subdued Muted Slate (`#64748b`).
- **Teks Isi & Sel Tabel (Body / Table Cells)**: `13px - 14px` | Regular (`400`) & Medium (`500`) | Line-height `1.5` | Warna: Slate Command Dark (`#0f172a`).
- **Metadata, Timestamp & Breadcrumbs**: `12px - 13px` | Regular (`400`) & Medium (`500`) | Warna: Subdued Muted Slate (`#64748b`).

---

## 4. Component Stylings

### 4.1 Buttons (`@astryxdesign/core/Button` / `@/components/ui/Button`)
- **Geometri & Bentuk**: Sudut melengkung halus (*Gently curved corners*) dengan `border-radius: 8px` (`var(--radius-md)`). Ketinggian minimal 38px untuk menjamin target sentuh (*tap target*) yang nyaman.
- **Varian**:
  * **Primary**: Berwarna Deep Clinical Teal (`#0d9488`) dengan teks putih pekat. Digunakan untuk aksi utama ("Lihat RME", "Simpan Data", "Masuk").
  * **Secondary**: Latar belakang putih dengan border tipis Clean Boundary Gray (`#e2e8f0`) dan teks Slate Command Dark. Digunakan untuk aksi pendukung ("Batal", "Tutup", "Kembali").
  * **Ghost / Icon**: Latar transparan tanpa border, memunculkan efek wash lembut Subdued Fill saat di-hover. Digunakan untuk toggle sidebar, tombol pagination, dan dismiss modal.
  * **Destructive**: Berwarna Emergency Ruby (`#dc2626`) dengan teks putih untuk aksi kritis.
- **Behavior & Interaksi**: Wajib memiliki indikator fokus terlihat (*visible focus ring*) `outline: 2px solid var(--color-primary-focus)` saat navigasi keyboard aktif. Mendukung state loading spinner bawaan tanpa pergeseran layout (*zero layout shift*).

### 4.2 Cards / Containers (`@astryxdesign/core/Card` / `@/components/ui/Card`)
- **Geometri**: Sudut melengkung proporsional (*Generously rounded corners*) dengan `border-radius: 12px` (`var(--radius-lg)`).
- **Latar Belakang & Border**: Latar putih bersih Crisp Sterile White (`#ffffff`) dengan garis batas halus 1px Clean Boundary Gray (`#e2e8f0`).
- **Elevasi & Kedalaman Bayangan**: Menggunakan bayangan difus sangat lembut (*Whisper-soft diffused shadow*) `0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)` (`var(--shadow-sm)` hingga `var(--shadow-md)`). Hindari bayangan hitam pekat yang kontras tajam.

### 4.3 Inputs & Forms (`@astryxdesign/core/TextInput` / `@/components/ui/Input`)
- **Geometri**: Sudut melengkung halus (`border-radius: 8px`), tinggi field 40px.
- **Stroke & Border**: Garis 1px Clean Boundary Gray (`#e2e8f0`), bertransisi halus menjadi Deep Clinical Teal (`#0d9488`) dengan soft outer glow saat berstatus `:focus`.
- **Status Error**: Stroke berganti menjadi Emergency Ruby (`#dc2626`) disertai pesan teks deskriptif di bawah field yang terhubung dengan aksesibilitas screen reader.

### 4.4 Data Tables (`@/components/ui/DataTable`)
- **Arsitektur Sticky Zero-Collision**:
  * **Sticky Header**: `position: sticky; top: 0; z-index: 10;` dengan latar belakang buram opak Subdued Header Fill (`#f1f5f9`).
  * **Sticky Action Column**: `position: sticky; right: 0; z-index: 5;` dengan latar belakang putih solid (`#ffffff`) dan bayangan elevasi di sisi kiri `box-shadow: -4px 0 8px -2px rgba(15, 23, 42, 0.06)`.
  * **Intersection Cell (Header Kolom Aksi Kanan Atas)**: `position: sticky; top: 0; right: 0; z-index: 20;` dengan latar Subdued Header Fill dan bayangan kiri yang selaras. Menjamin perpotongan sudut kanan atas selalu berada di lapisan teratas tanpa pernah tertutup baris data atau header lain saat scroll diagonal.
- **Rhythm & Padding Sel**: Padding lega `12px 16px` per sel. Teks sejajar vertikal di tengah (`vertical-align: middle`).
- **Row Hover State**: Baris berubah menjadi latar belakang Soft Medical Cyan Wash halus (`#f8fafc` atau `#f0fdfa`) saat kursor melintas, memberikan umpan balik visual instan.

### 4.5 Badges & Status Indicators (`@astryxdesign/core/Badge` / `@/components/ui/Badge`)
- **Bentuk**: Bentuk kapsul melingkar penuh (*Pill-shaped*) dengan `border-radius: 9999px`.
- **Ukuran**: Padding vertikal `2px` dan horizontal `10px`, font size `12px`, font weight `600`.
- **Peran Semantik Medis**:
  * *Rawat Inap*: Urgent Care Amber (`#d97706`) di atas Soft Amber Wash (`#fef3c7`).
  * *Rawat Jalan*: Diagnostic Sapphire (`#2563eb`) di atas Soft Sapphire Wash (`#dbeafe`).
  * *IGD (Gawat Darurat)*: Emergency Ruby (`#dc2626`) di atas Soft Ruby Wash (`#fee2e2`).
  * *Selesai / Pulang*: Vitality Emerald (`#16a34a`) di atas Soft Emerald Wash (`#dcfce7`).

### 4.6 Navigation & Layout Components
- **Sidebar**: Lebar desktop 260px, latar belakang Calm Clinical Canvas (`#f8fafc`), border kanan 1px (`#e2e8f0`). Menu aktif ditandai dengan latar Soft Medical Cyan Wash (`#f0fdfa`), teks Deep Clinical Teal, dan ikon yang selaras.
- **Top Header**: Ketinggian 64px, posisi `sticky top: 0`, latar Crisp Sterile White (`#ffffff`), border bawah 1px (`#e2e8f0`), elevasi minimal `0 1px 2px 0 rgba(0, 0, 0, 0.03)`.
- **Breadcrumb**: Terbungkus dalam semantik `<nav aria-label="Breadcrumb">`, menampilkan hierarki navigasi yang jelas dengan delimiter chevron (`/` atau `>`). Elemen daun terakhir berstatus teks statis aktif yang tidak dapat diklik.

---

## 5. Layout Principles & Spacing Strategy

### 5.1 Skala Spasi (Spacing Scale 4px-Based)
Seluruh margin, padding, dan celah antar elemen wajib menggunakan skala spasi standar:
- `var(--space-1)` = `4px` — Jarak micro (ikon ke teks, badge padding).
- `var(--space-2)` = `8px` — Jarak input label ke field, margin badge.
- `var(--space-3)` = `12px` — Padding vertikal tabel, gap tombol kecil.
- `var(--space-4)` = `16px` — Padding horizontal tabel, gap form standar.
- `var(--space-5)` = `20px` — Jarak antar section dalam kartu.
- `var(--space-6)` = `24px` — Padding utama canvas halaman dashboard.
- `var(--space-8)` = `32px` — Jarak antar blok kartu besar.

### 5.2 Responsive Breakpoints
1. **Desktop (Lebar Layar >= 1024px)**:
   - Sidebar navigasi bersifat permanen (*fixed*) dengan lebar 260px.
   - Tabel data ditampilkan dalam lebar optimal dengan fitur sticky header dan sticky right action column aktif.
   - Padding area kerja utama: `24px` (`var(--space-6)`).
2. **Tablet (Lebar Layar 768px - 1023px)**:
   - Sidebar dapat di-collapse menjadi mode mini atau disembunyikan melalui tombol toggle.
   - Tabel data dibungkus dalam wadah scroll horizontal yang halus (*smooth horizontal overflow container*).
   - Padding area kerja: `20px` (`var(--space-5)`).
3. **Mobile (Lebar Layar < 768px)**:
   - Sidebar bertransformasi menjadi **Slide-over Drawer** dengan overlay gelap transparan (`rgba(15, 23, 42, 0.4)`) dan mekanisme klik backdrop untuk menutup (*click-to-dismiss*).
   - Topbar menampilkan tombol menu hamburger yang mudah dijangkau ibu jari.
   - Kontrol toolbar (search, filter, pagination) disusun secara vertikal (*stacked layout*).
   - Padding area kerja: `16px` (`var(--space-4)`).

### 5.3 Aturan Integritas Styling Global
- **Aturan Single Global CSS**: Seluruh gaya visual aplikasi hanya boleh bersumber dari [src/index.css](file:///c:/new-work-area/personal/inova-medika/frontend/src/index.css). Dilarang membuat file stylesheet baru yang terpisah.
- **Aturan Light Mode Murni**: Dilarang menyisipkan media query `@media (prefers-color-scheme: dark)` atau kelas dark mode yang dapat merusak kontras visual standar fasilitas medis SIMRS Inova Medika.
