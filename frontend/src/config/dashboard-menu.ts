/**
 * Konfigurasi Terpusat Menu Dashboard SIMRS.
 * Seluruh penambahan, pengubahan, atau penghapusan menu cukup dilakukan di file ini
 * tanpa perlu mengubah komponen Sidebar.
 */

export interface MenuItem {
  id: string;
  title: string;
  icon?: string;
  path?: string;
  badge?: string;
  badgeVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  roles?: string[]; // RBAC roles allowed
  children?: MenuItem[];
}

export interface MenuGroup {
  groupTitle?: string;
  items: MenuItem[];
}

export const DASHBOARD_MENU: MenuGroup[] = [
  {
    groupTitle: 'Layanan Pasien',
    items: [
      {
        id: 'registration',
        title: 'Pendaftaran & Antrean',
        icon: 'users',
        badge: 'Aktif',
        badgeVariant: 'primary',
        children: [
          { id: 'reg-new', title: 'Pendaftaran Kunjungan', path: '/registration/new' },
          { id: 'reg-live-board', title: 'Live Board Antrean', path: '/registration/board' },
          { id: 'patient-all', title: 'Data Pasien Rawat Jalan', path: '/patients' },
        ],
      },
      {
        id: 'nurse-triage',
        title: 'Skrining & Triage Nakes',
        icon: 'activity',
        path: '/nurse/triage',
        roles: ['admin', 'nurse'],
      },
      {
        id: 'doctor-consultation',
        title: 'Konsultasi RME Dokter',
        icon: 'file-text',
        path: '/doctor/consultation',
        roles: ['admin', 'doctor'],
      },
    ],
  },
  {
    groupTitle: 'Medis & Penunjang',
    items: [
      {
        id: 'pharmacy',
        title: 'Farmasi & e-Resep',
        icon: 'pill',
        children: [
          { id: 'pharmacy-prescriptions', title: 'Antrean e-Resep', path: '/pharmacy/prescriptions' },
          { id: 'master-medicines', title: 'Master Obat & Stok', path: '/master/medicines' },
        ],
      },
      {
        id: 'laboratory',
        title: 'Laboratorium Klinis',
        icon: 'activity',
        path: '/laboratory',
        roles: ['admin', 'lab', 'doctor'],
      },
      {
        id: 'billing',
        title: 'Kasir & Pembayaran',
        icon: 'credit-card',
        path: '/billing',
        roles: ['admin', 'cashier'],
      },
    ],
  },
  {
    groupTitle: 'Master Data & Pengaturan',
    items: [
      {
        id: 'master-data',
        title: 'Pengelolaan Master Data',
        icon: 'settings',
        children: [
          { id: 'master-patients', title: 'Master Pasien (NIK/RM)', path: '/master/patients' },
          { id: 'master-doctors', title: 'Master Dokter & Jadwal', path: '/master/doctors' },
          { id: 'master-medicines-alt', title: 'Master Obat & Mutasi', path: '/master/medicines' },
        ],
      },
      {
        id: 'audit-trail',
        title: 'Audit Trail UU PDP',
        icon: 'shield',
        path: '/audit-trail',
        roles: ['admin'],
      },
      {
        id: 'dashboard-analytics',
        title: 'Dashboard & Laporan',
        icon: 'trending-up',
        path: '/dashboard',
        roles: ['admin', 'doctor', 'cashier'],
      },
    ],
  },
];
