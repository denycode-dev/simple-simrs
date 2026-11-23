# AGENTS.md

Panduan terpadu untuk AI Coding Agents dan Pengembang antarmuka pada proyek **SIMRS Inova Medika**.

---

<!-- ASTRYX:START -->
Astryx v0.7.17 · 174 components
CLI: run every command as `npx astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — start every page from a template, never from scratch:
1. `astryx build "<idea>"` — names the template to scaffold from and the parts it lacks.
2. `astryx template <name> <path>` — scaffold it; keep its frame, gap and padding; replace the content.
3. `astryx component <Name>` to read props before using one; `astryx template <Block>` prints a block example to read for a part it lacks. Astryx names differ from other libraries: buttons, badges, tokens and tabs take their text in `label` (Text, Heading and Link take children), booleans start with `is` or `has` (`isOpen`, `isDisabled`), and every input takes `value` and `onChange`.
Changing an existing page? Keep it: skip step 2 and add components inside its sections; read a block example when it helps.
Before you deliver a build, run `astryx doctor --built <dir>`; don't deliver it if it fails.

RULES:
- No <div> — components handle all layout and spacing.
- Read `astryx docs layout` before changing a template's frame.
- Dense data = rows (Table, List/Item), not Card-wrapped lists. Badge = counts only.
- Style with component props first, then tokens (var(--color-*|--spacing-*|--radius-*)). No raw hex/px. No StyleX/Tailwind compiler here — don't use xstyle/utility classes directly. Some templates use StyleX and need a compiler plugin; see `astryx docs styling-overview`.
- THEMES: palettes and custom colors go through the theme, never :root overrides; so does a denser or roomier app (`editor set <name> spacing tight`), never gap and padding changes page by page. A change to one kind of part (the sidebar, its selected item, the gaps in a form) is a theme change too, not props on one page: `editor how "<ask>"` names the `set … --on <part>` line. No app yet: `astryx experimental theme preview app <dir>` makes a starter app that shows the theme. To make or change a theme (colors, fonts, corners, spacing, a look from a picture), prefer the experimental theme editor over hand-written theme files: `astryx experimental theme editor new <name> --like neutral`, then `editor set <name> <thing> <value>` or `editor how "<what you want>"`; wire it with `astryx theme add <name>`; after each change look at it with `astryx experimental theme editor show <name> --png` (takes pictures of real components) and open the PNGs it writes; a theme change is not done until you have looked at the pictures. In code, extend an imported theme to customize it; `theme eject <slug>` only forks source. See `astryx docs theme`.
- SELF-CHECK: re-read the file; replace any raw <div>/<span>, imported .css/@apply, or hardcoded #hex/px with the component or a token.

`astryx help` lists every command. Key ones beyond the workflow:
  search "<query>"   find any component / hook / doc / template
  discover <words>   integrations you could add
  docs <topic>       getting-started, principles, tokens, theme … (`astryx docs` lists all)
  docs cli           commands and API reference
  docs authoring     build an integration package, and every field it holds
  upgrade --from <old version> --apply   run after a dependency bump
To remove this block, run `astryx init --remove-agents`, which removes it from the agent files at the project root and in the folder you run it in; from any other file it leaves, delete everything from ASTRYX:START to ASTRYX:END.
<!-- ASTRYX:END -->

---

## 📌 Ringkasan Astryx Design System v0.7.17 (SIMRS Inova Medika)

Astryx adalah design system *agent-ready* berbasis React 19+ dan StyleX. Mengusung filosofi bahwa komponen menangani layout, spacing, dan aksesibilitas secara terpadu tanpa perlu membuat wrapper `<div>` acak atau utility classes yang tidak terstandar.

### Setup Dasar
Diimpor satu kali di stylesheet global tunggal (`src/index.css`):
```css
@import '@astryxdesign/core/astryx.css';
@import '@astryxdesign/theme-neutral/theme.css';
```

Tema neutral diaktifkan dan dikunci ke **Light Mode** melalui:
```tsx
import { Theme } from '@astryxdesign/core';
import { themes, defaultThemeSlug } from './astryx-themes';

<Theme theme={themes[defaultThemeSlug]} mode="light">
  <App />
</Theme>
```

---

## 🧩 Konvensi Komponen Utama (Re-exported via `@/components/ui`)

### 1. Button (`@astryxdesign/core/Button` atau `@/components/ui/Button`)
- **Prop `label` Wajib**: Astryx mewajibkan prop `label` sebagai string yang mendeskripsikan aksi secara aksesibel.
- **Boolean Props diawali `is` / `has`**: Gunakan `isLoading` dan `isDisabled` (bukan `loading` atau `disabled`).
- **Varian**: `'primary' | 'secondary' | 'ghost' | 'destructive'`.

```tsx
import { Button } from '@/components/ui';

<Button
  label="Simpan Data Pasien"
  variant="primary"
  isLoading={isSaving}
  onClick={handleSave}
/>
```

### 2. TextInput (`@astryxdesign/core/TextInput` atau `@/components/ui/Input`)
- **Prop `label` Wajib**: Selalu sediakan teks label yang eksplisit.
- **Signature `onChange`**: Menerima `(value: string, event) => void`.
- **Status Validasi**: Gunakan objek `status={{ type: 'error', message: 'Pesan error' }}`.

```tsx
import { Input } from '@/components/ui';

<Input
  label="Nomor Rekam Medis"
  value={rmNumber}
  onChange={(e) => setRmNumber(e.target.value)}
  error={formErrors.rmNumber}
  placeholder="misal: RM-2026-0001"
  required
/>
```

### 3. Badge (`@astryxdesign/core/Badge` atau `@/components/ui/Badge`)
- Menampilkan status ringkas (Rawat Jalan, Rawat Inap, IGD, Selesai).
- Prop `label` menerima teks atau ReactNode.
- Varian: `'neutral' | 'info' | 'success' | 'warning' | 'error' | 'teal'`.

```tsx
import { Badge } from '@/components/ui';

<Badge label="Rawat Inap" variant="warning" />
```

### 4. Card (`@astryxdesign/core/Card` atau `@/components/ui/Card`)
- Wadah kontainer berbatas jelas dengan opsi `elevation` (`'none' | 'low' | 'med' | 'high'`) dan `padding` (skala 1-10).

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

<Card elevation="low" padding={4}>
  <CardHeader>
    <CardTitle>Data Pasien Terpilih</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Informasi rekam medis...</p>
  </CardContent>
</Card>
```

### 5. Banner / Alert (`@astryxdesign/core/Banner` atau `@/components/ui/Alert`)
- Menampilkan pesan notifikasi atau status kesalahan formulir yang persisten.
- Prop `status`: `'info' | 'warning' | 'error' | 'success'`.

```tsx
import { Alert } from '@/components/ui';

<Alert variant="danger" title="Gagal Menyimpan">
  Terjadi kendala saat menghubungi server backend SIMRS.
</Alert>
```

### 6. Reusable DataTable (`@/components/ui/DataTable`)
- Komponen tabel generik `<T>` dengan:
  - Sticky header (`top: 0`, `z-index: 10`).
  - Sticky right action column (`right: 0`, `z-index: 5`).
  - Sticky intersection corner (`top: 0`, `right: 0`, `z-index: 20`).
  - Built-in debounced search, sorting, dan paginasi.

---

## ⚠️ Aturan Operasional Penting untuk Agen AI (Rules of Engagement)

1. **Gunakan Astryx Primitives Terlebih Dahulu**: Jangan membuat elemen kustom baru jika Astryx telah menyediakannya.
2. **Hanya Satu File CSS Global (`src/index.css`)**: Dilarang membuat file CSS terpisah baru (`variables.css`, `App.css`, dll.) agar tidak terjadi bentrokan styling.
3. **Murni Light Mode**: Aplikasi hanya mendukung tema terang. Jangan menambahkan tema gelap atau toggle tema. Gunakan selalu token `mode="light"`.
4. **Gunakan Token Warna & Spasi Tema**: Hindari menulis nilai hex atau pixel sembarangan; gunakan CSS variables bawaan (`var(--color-border)`, `var(--color-primary)`, dsb.).
5. **Cek Kesehatan Desain**: Jalankan `npx astryx doctor` sebelum menyelesaikan tugas UI untuk memastikan tidak ada pelanggaran aturan tema dan stylesheet.
6. **Cari Komponen via CLI**:
   - Cari komponen: `npx astryx search "<nama>"`
   - Cek detail props: `npx astryx component <NamaKomponen>`
