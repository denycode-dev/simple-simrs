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
        id: 'patients',
        title: 'Data Pasien & Antrean',
        icon: 'users',
        badge: 'Aktif',
        badgeVariant: 'primary',
        children: [
          { id: 'patient-all', title: 'Semua Pasien', path: '/patients' },
          { id: 'patient-outpatient', title: 'Rawat Jalan', path: '/patients/outpatient' },
          { id: 'patient-inpatient', title: 'Rawat Inap', path: '/patients/inpatient' },
          { id: 'patient-emergency', title: 'IGD (Gawat Darurat)', path: '/patients/emergency' },
        ],
      },
      {
        id: 'appointments',
        title: 'Jadwal Dokter & Poliklinik',
        icon: 'calendar',
        children: [
          { id: 'schedule-doctor', title: 'Jadwal Praktik DPJP', path: '/schedule/doctors' },
          { id: 'schedule-rooms', title: 'Ketersediaan Bed & Kamar', path: '/schedule/rooms' },
        ],
      },
    ],
  },
  {
    groupTitle: 'Medis & Penunjang',
    items: [
      {
        id: 'medical-records',
        title: 'Rekam Medis Elektronik (RME)',
        icon: 'file-text',
        path: '/medical-records',
      },
      {
        id: 'pharmacy',
        title: 'Farmasi & Resep Obat',
        icon: 'pill',
        children: [
          { id: 'pharmacy-prescriptions', title: 'Antrean Resep', path: '/pharmacy/prescriptions' },
          { id: 'pharmacy-inventory', title: 'Stok Obat & Gudang', path: '/pharmacy/inventory' },
        ],
      },
      {
        id: 'laboratory',
        title: 'Laboratorium & Radiologi',
        icon: 'activity',
        path: '/laboratory',
      },
    ],
  },
  {
    groupTitle: 'Administrasi & Sistem',
    items: [
      {
        id: 'billing',
        title: 'Kasir & Pembayaran',
        icon: 'credit-card',
        path: '/billing',
      },
      {
        id: 'settings',
        title: 'Pengaturan SIMRS',
        icon: 'settings',
        children: [
          { id: 'settings-hospital', title: 'Profil Rumah Sakit', path: '/settings/hospital' },
          { id: 'settings-users', title: 'Manajemen Pengguna & Hak Akses', path: '/settings/users' },
        ],
      },
    ],
  },
];
