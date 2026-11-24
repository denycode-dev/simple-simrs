import { DASHBOARD_MENU, isRoleAllowed } from '../config/dashboard-menu';
import type { BreadcrumbItem } from '../components/layout';

export const ROUTES = {
  LOGIN: '/login',
  PATIENTS: '/patients',
  REG_NEW: '/registration/new',
  REG_BOARD: '/registration/board',
  NURSE_TRIAGE: '/nurse/triage',
  DOCTOR_CONSULTATION: '/doctor/consultation',
  PHARMACY_PRESCRIPTIONS: '/pharmacy/prescriptions',
  MASTER_MEDICINES: '/master/medicines',
  LABORATORY: '/laboratory',
  BILLING: '/billing',
  MASTER_PATIENTS: '/master/patients',
  MASTER_DOCTORS: '/master/doctors',
  AUDIT_TRAIL: '/audit-trail',
  DASHBOARD: '/dashboard',
  FORBIDDEN: '/403',
  SERVER_ERROR: '/500',
  NOT_FOUND: '/404',
} as const;

export interface RouteDefinition {
  id: string;
  path: string;
  title: string;
  allowedRoles: string[];
  parentGroupTitle?: string;
  parentMenuTitle?: string;
}

/**
 * Matriks Hak Akses Terpusat Sesuai docs/SPECIFICATION.md & docs/plans
 */
export const APP_ROUTES: RouteDefinition[] = [
  {
    id: 'patient-all',
    path: '/patients',
    title: 'Data Pasien Rawat Jalan',
    allowedRoles: ['admin', 'registration', 'nurse', 'doctor', 'pharmacist', 'lab', 'cashier'],
    parentGroupTitle: 'Layanan Pasien',
    parentMenuTitle: 'Pendaftaran & Antrean',
  },
  {
    id: 'reg-new',
    path: '/registration/new',
    title: 'Pendaftaran Kunjungan',
    allowedRoles: ['admin', 'registration'],
    parentGroupTitle: 'Layanan Pasien',
    parentMenuTitle: 'Pendaftaran & Antrean',
  },
  {
    id: 'reg-live-board',
    path: '/registration/board',
    title: 'Live Board Antrean',
    allowedRoles: ['admin', 'registration'],
    parentGroupTitle: 'Layanan Pasien',
    parentMenuTitle: 'Pendaftaran & Antrean',
  },
  {
    id: 'nurse-triage',
    path: '/nurse/triage',
    title: 'Skrining & Triage Nakes',
    allowedRoles: ['admin', 'nurse'],
    parentGroupTitle: 'Layanan Pasien',
  },
  {
    id: 'doctor-consultation',
    path: '/doctor/consultation',
    title: 'Konsultasi RME Dokter',
    allowedRoles: ['admin', 'doctor'],
    parentGroupTitle: 'Layanan Pasien',
  },
  {
    id: 'pharmacy-prescriptions',
    path: '/pharmacy/prescriptions',
    title: 'Antrean e-Resep',
    allowedRoles: ['admin', 'pharmacist'],
    parentGroupTitle: 'Medis & Penunjang',
    parentMenuTitle: 'Farmasi & e-Resep',
  },
  {
    id: 'master-medicines',
    path: '/master/medicines',
    title: 'Master Obat & Stok',
    allowedRoles: ['admin', 'pharmacist'],
    parentGroupTitle: 'Medis & Penunjang',
    parentMenuTitle: 'Farmasi & e-Resep',
  },
  {
    id: 'laboratory',
    path: '/laboratory',
    title: 'Laboratorium Klinis',
    allowedRoles: ['admin', 'lab', 'doctor'],
    parentGroupTitle: 'Medis & Penunjang',
  },
  {
    id: 'billing',
    path: '/billing',
    title: 'Kasir & Pembayaran',
    allowedRoles: ['admin', 'cashier'],
    parentGroupTitle: 'Medis & Penunjang',
  },
  {
    id: 'master-patients',
    path: '/master/patients',
    title: 'Master Pasien (NIK/RM)',
    allowedRoles: ['admin', 'registration'],
    parentGroupTitle: 'Master Data & Pengaturan',
    parentMenuTitle: 'Pengelolaan Master Data',
  },
  {
    id: 'master-doctors',
    path: '/master/doctors',
    title: 'Master Dokter & Jadwal',
    allowedRoles: ['admin'],
    parentGroupTitle: 'Master Data & Pengaturan',
    parentMenuTitle: 'Pengelolaan Master Data',
  },
  {
    id: 'audit-trail',
    path: '/audit-trail',
    title: 'Audit Trail UU PDP',
    allowedRoles: ['admin'],
    parentGroupTitle: 'Master Data & Pengaturan',
  },
  {
    id: 'dashboard-analytics',
    path: '/dashboard',
    title: 'Dashboard & Laporan',
    allowedRoles: ['admin', 'doctor', 'cashier'],
    parentGroupTitle: 'Master Data & Pengaturan',
  },
];

export interface MenuPathInfo {
  activeMenuId: string;
  activeMenuTitle: string;
  breadcrumbTrail: BreadcrumbItem[];
  matchedRoute?: RouteDefinition;
}

/**
 * Menghitung activeMenuId, activeMenuTitle, dan breadcrumbs berdasarkan URL pathname
 */
export function getMenuInfoFromPath(pathname: string): MenuPathInfo {
  // Normalize pathname (hilangkan trailing slash kecuali root)
  const normalizedPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  // 1. Cek dari APP_ROUTES
  const matchedRoute = APP_ROUTES.find((r) => r.path === normalizedPath);
  if (matchedRoute) {
    const trail: BreadcrumbItem[] = [];
    if (matchedRoute.parentGroupTitle) {
      trail.push({ label: matchedRoute.parentGroupTitle });
    }
    if (matchedRoute.parentMenuTitle) {
      trail.push({ label: matchedRoute.parentMenuTitle });
    }
    trail.push({ label: matchedRoute.title });

    return {
      activeMenuId: matchedRoute.id,
      activeMenuTitle: matchedRoute.title,
      breadcrumbTrail: trail,
      matchedRoute,
    };
  }

  // 2. Fallback pencarian di DASHBOARD_MENU
  for (const group of DASHBOARD_MENU) {
    for (const item of group.items) {
      if (item.path === normalizedPath) {
        const trail: BreadcrumbItem[] = [];
        if (group.groupTitle) trail.push({ label: group.groupTitle });
        trail.push({ label: item.title });
        return {
          activeMenuId: item.id,
          activeMenuTitle: item.title,
          breadcrumbTrail: trail,
        };
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.path === normalizedPath) {
            const trail: BreadcrumbItem[] = [];
            if (group.groupTitle) trail.push({ label: group.groupTitle });
            trail.push({ label: item.title });
            trail.push({ label: child.title });
            return {
              activeMenuId: child.id,
              activeMenuTitle: child.title,
              breadcrumbTrail: trail,
            };
          }
        }
      }
    }
  }

  // Fallback default (misal 404/not found)
  return {
    activeMenuId: '',
    activeMenuTitle: 'SIMRS',
    breadcrumbTrail: [{ label: 'Simple SIMRS' }],
  };
}

/**
 * Memeriksa apakah role pengguna berhak mengakses rute tertentu
 */
export function isRouteAllowed(path: string, userRole?: string): boolean {
  const route = APP_ROUTES.find((r) => r.path === path);
  if (!route) return true; // rute publik atau unknown
  return isRoleAllowed(route.allowedRoles, userRole);
}
