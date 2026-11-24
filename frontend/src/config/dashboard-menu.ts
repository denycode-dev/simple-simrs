/**
 * Konfigurasi Terpusat Menu Dashboard SIMRS dengan Hak Akses Berbasis Peran (RBAC 7 Peran).
 */

export interface MenuItem {
  id: string;
  title: string;
  icon?: string;
  path?: string;
  badge?: string;
  badgeVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  roles?: string[]; // Allowed roles (e.g., ['admin', 'nurse'])
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
        roles: ['admin', 'registration'],
        children: [
          { id: 'reg-new', title: 'Pendaftaran Kunjungan', path: '/registration/new', roles: ['admin', 'registration'] },
          { id: 'reg-live-board', title: 'Live Board Antrean', path: '/registration/board', roles: ['admin', 'registration'] },
          { id: 'patient-all', title: 'Data Pasien Rawat Jalan', path: '/patients', roles: ['admin', 'registration', 'nurse', 'doctor', 'cashier'] },
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
        roles: ['admin', 'pharmacist'],
        children: [
          { id: 'pharmacy-prescriptions', title: 'Antrean e-Resep', path: '/pharmacy/prescriptions', roles: ['admin', 'pharmacist'] },
          { id: 'master-medicines', title: 'Master Obat & Stok', path: '/master/medicines', roles: ['admin', 'pharmacist'] },
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
        roles: ['admin', 'registration', 'pharmacist'],
        children: [
          { id: 'master-patients', title: 'Master Pasien (NIK/RM)', path: '/master/patients', roles: ['admin', 'registration'] },
          { id: 'master-doctors', title: 'Master Dokter & Jadwal', path: '/master/doctors', roles: ['admin'] },
          { id: 'master-medicines-alt', title: 'Master Obat & Mutasi', path: '/master/medicines', roles: ['admin', 'pharmacist'] },
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

/**
 * Validates if the user role is authorized to view or access an item.
 */
export function isRoleAllowed(requiredRoles?: string[], userRole?: string): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  if (!userRole) return false;
  if (userRole === 'admin') return true;
  return requiredRoles.includes(userRole);
}

/**
 * Filters dashboard navigation groups and menu items based on the active user role.
 */
export function filterMenuByRole(groups: MenuGroup[], userRole?: string): MenuGroup[] {
  return groups
    .map((group) => {
      const filteredItems = group.items
        .map((item) => {
          if (item.children && item.children.length > 0) {
            const allowedChildren = item.children.filter((child) =>
              isRoleAllowed(child.roles || item.roles, userRole)
            );
            if (allowedChildren.length > 0) {
              return { ...item, children: allowedChildren };
            }
            return null;
          }

          return isRoleAllowed(item.roles, userRole) ? item : null;
        })
        .filter((item): item is MenuItem => item !== null);

      return { ...group, items: filteredItems };
    })
    .filter((group) => group.items.length > 0);
}
