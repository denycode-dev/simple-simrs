# Frontend SIMRS (Sistem Informasi Manajemen Rumah Sakit)

Aplikasi antarmuka web modern untuk Sistem Informasi Manajemen Rumah Sakit (SIMRS) yang dibangun menggunakan **React 19**, **Vite 8**, dan **TypeScript 6**, dengan arsitektur **Feature-Based Development** serta sistem desain **Astryx (Meta)** yang berfokus pada **Pure Light Mode** & **WCAG AAA Accessibility**.

---

## 🎨 Design System: Astryx (Meta) & Theme Neutral

Antarmuka aplikasi ditenagai oleh **Astryx Design System v0.7.17** dari Meta yang dirancang secara *agent-ready* dan dioptimalkan untuk React 19:
- **Core Library**: `@astryxdesign/core`
- **Styling Engine**: StyleX (`@stylexjs/stylex`) & Pre-built CSS Layer
- **Theme Package**: `@astryxdesign/theme-neutral` (Typography Figtree & Netral Healthcare Palette)
- **CLI Tooling**: `@astryxdesign/cli` untuk inspeksi komponen dan verifikasi via `npx astryx doctor`
- **Komponen Primitif**: Komponen di `src/components/ui/` mengadaptasi primitif resmi Astryx (`Button`, `TextInput`, `Badge`, `Card`, `Banner`).

---

## 🏛️ Arsitektur: Feature-Based Development

Aplikasi mengorganisir kode berdasarkan **domain bisnis fitur**:

### Prinsip Utama:
1. **Feature Encapsulation**: Seluruh kode yang berkaitan erat dengan satu domain bisnis (`api`, `components`, `hooks`, `types`) diisolasi dalam satu folder fitur di dalam `src/features/<feature-name>/`.
2. **Public API Boundary**: Setiap fitur memiliki file `index.ts` sebagai gerbang publik (*barrel export*).
3. **Shared Foundation**: Komponen dan fungsi yang bersifat generik disimpan di `src/components/ui/`, `src/lib/`, `src/hooks/`, atau `src/utils/`.
4. **Theme Provider Integration**: Aplikasi dibungkus oleh provider `<Theme theme={themes[defaultThemeSlug]}>` dari `src/astryx-themes.ts`.

---

## 📁 Struktur Direktori

```text
frontend/
├── src/
│   ├── assets/                 # Aset statis global (gambar, ikon SVG)
│   ├── components/             # Komponen bersama (Domain-Agnostic)
│   │   ├── layout/             # Layout aplikasi (DashboardLayout, Sidebar, Header, Breadcrumb)
│   │   └── ui/                 # Primitives UI & DataTable (Button, Input, Card, Badge, Alert, DataTable)
│   ├── config/                 # Konfigurasi aplikasi (env.ts, dashboard-menu.ts)
│   ├── features/               # Modul Domain Bisnis (Feature Modules)
│   │   ├── auth/               # Fitur Autentikasi & Pengguna Medis
│   │   │   ├── api/            # Panggilan API autentikasi (loginApi, logoutApi)
│   │   │   ├── components/     # Komponen UI fitur (LoginForm, UserProfile)
│   │   │   ├── hooks/          # Custom hooks fitur (useAuth)
│   │   │   ├── types/          # Definisi tipe & antarmuka fitur (AuthUser, LoginCredentials)
│   │   │   └── index.ts        # Public API export fitur auth
│   │   └── patients/           # Fitur Manajemen Pasien SIMRS
│   │       ├── api/            # Panggilan API data pasien (getPatientsApi)
│   │       ├── components/     # PatientTable, PatientCard, PatientList, PatientFilterBar
│   │       ├── hooks/          # usePatients (fetch, search, filter)
│   │       ├── types/          # Patient, PatientFilter, PatientStatus
│   │       └── index.ts        # Public API export fitur patients
│   ├── hooks/                  # Custom hooks bersama tingkat global (useDebounce)
│   ├── lib/                    # Abstraksi klien HTTP (api-client native fetch)
│   ├── types/                  # Kontrak tipe TypeScript global (api.ts)
│   ├── utils/                  # Fungsi utilitas pembantu (formatters.ts)
│   ├── astryx-themes.ts        # Konfigurasi tema Astryx ter-generate (Theme Neutral)
│   ├── App.tsx                 # Root component dengan Astryx Theme Provider
│   ├── index.css               # Satu-satunya stylesheet global (Astryx Core + Design Tokens Light Mode)
│   └── main.tsx                # Entry point aplikasi React
├── agent.md                    # Panduan konvensi Astryx untuk AI Agent & Pengembang
├── AGENTS.md                   # Instruksi agent bawaan Astryx CLI
├── tsconfig.app.json           # Konfigurasi TypeScript & path alias (@/*)
├── vite.config.ts              # Konfigurasi Vite & path alias
└── package.json
```

---


---

## 📊 Komponen DataTable & Dashboard Menu

### 1. Konfigurasi Menu Terpusat (`src/config/dashboard-menu.ts`)
Seluruh item menu dashboard (termasuk grup, nested submenu, active state, dan badge) didefinisikan secara terpusat:
```ts
import { DASHBOARD_MENU } from '@/config/dashboard-menu';
```
Penambahan menu baru dapat dilakukan hanya dengan memperbarui array `DASHBOARD_MENU` tanpa perlu mengubah komponen `Sidebar`.

### 2. Dual Sticky DataTable (`src/components/ui/DataTable.tsx`)
Komponen tabel data generik (`DataTable<T>`) yang dirancang untuk dataset enterprise:
- **Sticky Header**: Header tetap berada di bagian atas saat scrolling vertikal (`position: sticky; top: 0; z-index: 10`).
- **Sticky Action Column**: Kolom aksi tetap berada di sebelah kanan saat scrolling horizontal (`position: sticky; right: 0; z-index: 5`).
- **Intersection Anchor**: Header kolom aksi di sudut kanan atas memiliki `z-index: 20` dengan background solid untuk mencegah overlap / tabrakan visual saat kedua scrollbar digerakkan bersamaan.
- **Built-in Features**: Pencarian ter-debounce, sorting multi-kolom interaktif, pagination, baris per halaman, skeleton loading, dan empty state.

## 🤖 Panduan Agent & Astryx CLI

Proyek dilengkapi dokumentasi agen di berkas `agent.md` dan `AGENTS.md`.

### Perintah Berguna Astryx CLI:
- **Pemeriksaan Kesehatan Design System**:
  ```bash
  npx astryx doctor
  ```
- **Pencarian Komponen / Template**:
  ```bash
  npx astryx search "<kata-kunci>"
  ```
- **Inspeksi Props Komponen**:
  ```bash
  npx astryx component <NamaKomponen>
  ```

---

## 🛠️ Perintah Pengembangan

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan server pengembangan Vite lokal (port 5173) |
| `npm run build` | Melakukan pemeriksaan tipe TypeScript (`tsc -b`) dan build produksi Vite |
| `npm run lint` | Menjalankan linter ESLint untuk validasi kualitas kode |
| `npm run preview` | Meninjau hasil build produksi secara lokal |

---

## 🧪 Kredensial Demo Awal

Untuk menguji fitur autentikasi pada antarmuka:
- **Username**: `admin`
- **Kata Sandi**: `admin123`
- **Role**: Dokter Spesialis Penyakit Dalam (`dr. Hendra Pratama, Sp.PD`)
