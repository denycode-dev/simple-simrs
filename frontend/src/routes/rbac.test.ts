import { describe, it, expect } from 'vitest';
import { APP_ROUTES, getMenuInfoFromPath, isRouteAllowed, ROUTES } from './routes.config';

describe('RBAC Route Security & Mapping Suite', () => {
  it('defines 13 protected application routes with explicit allowed roles', () => {
    expect(APP_ROUTES.length).toBe(13);
  });

  describe('RBAC Matrix (7 Peran) Access Validation', () => {
    it('grants admin full access across all registered routes', () => {
      APP_ROUTES.forEach((route) => {
        expect(isRouteAllowed(route.path, 'admin')).toBe(true);
      });
    });

    it('validates registration role permissions', () => {
      // Allowed: patients, registration/new, registration/board, master/patients
      expect(isRouteAllowed(ROUTES.PATIENTS, 'registration')).toBe(true);
      expect(isRouteAllowed(ROUTES.REG_NEW, 'registration')).toBe(true);
      expect(isRouteAllowed(ROUTES.REG_BOARD, 'registration')).toBe(true);
      expect(isRouteAllowed(ROUTES.MASTER_PATIENTS, 'registration')).toBe(true);

      // Forbidden: clinical consultation, triage, pharmacy, billing, audit trail
      expect(isRouteAllowed(ROUTES.DOCTOR_CONSULTATION, 'registration')).toBe(false);
      expect(isRouteAllowed(ROUTES.NURSE_TRIAGE, 'registration')).toBe(false);
      expect(isRouteAllowed(ROUTES.PHARMACY_PRESCRIPTIONS, 'registration')).toBe(false);
      expect(isRouteAllowed(ROUTES.BILLING, 'registration')).toBe(false);
      expect(isRouteAllowed(ROUTES.AUDIT_TRAIL, 'registration')).toBe(false);
    });

    it('validates nurse role permissions', () => {
      // Allowed: patients, nurse/triage
      expect(isRouteAllowed(ROUTES.PATIENTS, 'nurse')).toBe(true);
      expect(isRouteAllowed(ROUTES.NURSE_TRIAGE, 'nurse')).toBe(true);

      // Forbidden: doctor consultation, pharmacy, billing, audit trail
      expect(isRouteAllowed(ROUTES.DOCTOR_CONSULTATION, 'nurse')).toBe(false);
      expect(isRouteAllowed(ROUTES.PHARMACY_PRESCRIPTIONS, 'nurse')).toBe(false);
      expect(isRouteAllowed(ROUTES.BILLING, 'nurse')).toBe(false);
      expect(isRouteAllowed(ROUTES.AUDIT_TRAIL, 'nurse')).toBe(false);
    });

    it('validates doctor role permissions', () => {
      // Allowed: patients, doctor consultation, laboratory, dashboard
      expect(isRouteAllowed(ROUTES.PATIENTS, 'doctor')).toBe(true);
      expect(isRouteAllowed(ROUTES.DOCTOR_CONSULTATION, 'doctor')).toBe(true);
      expect(isRouteAllowed(ROUTES.LABORATORY, 'doctor')).toBe(true);
      expect(isRouteAllowed(ROUTES.DASHBOARD, 'doctor')).toBe(true);

      // Forbidden: cashier billing, registration new, pharmacy prescriptions, audit trail
      expect(isRouteAllowed(ROUTES.BILLING, 'doctor')).toBe(false);
      expect(isRouteAllowed(ROUTES.REG_NEW, 'doctor')).toBe(false);
      expect(isRouteAllowed(ROUTES.PHARMACY_PRESCRIPTIONS, 'doctor')).toBe(false);
      expect(isRouteAllowed(ROUTES.AUDIT_TRAIL, 'doctor')).toBe(false);
    });

    it('validates pharmacist role permissions', () => {
      // Allowed: patients, pharmacy prescriptions, master medicines
      expect(isRouteAllowed(ROUTES.PATIENTS, 'pharmacist')).toBe(true);
      expect(isRouteAllowed(ROUTES.PHARMACY_PRESCRIPTIONS, 'pharmacist')).toBe(true);
      expect(isRouteAllowed(ROUTES.MASTER_MEDICINES, 'pharmacist')).toBe(true);

      // Forbidden: nurse triage, doctor consultation, billing, audit trail
      expect(isRouteAllowed(ROUTES.NURSE_TRIAGE, 'pharmacist')).toBe(false);
      expect(isRouteAllowed(ROUTES.DOCTOR_CONSULTATION, 'pharmacist')).toBe(false);
      expect(isRouteAllowed(ROUTES.BILLING, 'pharmacist')).toBe(false);
      expect(isRouteAllowed(ROUTES.AUDIT_TRAIL, 'pharmacist')).toBe(false);
    });

    it('validates lab role permissions', () => {
      // Allowed: patients, laboratory
      expect(isRouteAllowed(ROUTES.PATIENTS, 'lab')).toBe(true);
      expect(isRouteAllowed(ROUTES.LABORATORY, 'lab')).toBe(true);

      // Forbidden: nurse triage, billing, doctor consultation, audit trail
      expect(isRouteAllowed(ROUTES.NURSE_TRIAGE, 'lab')).toBe(false);
      expect(isRouteAllowed(ROUTES.BILLING, 'lab')).toBe(false);
      expect(isRouteAllowed(ROUTES.DOCTOR_CONSULTATION, 'lab')).toBe(false);
      expect(isRouteAllowed(ROUTES.AUDIT_TRAIL, 'lab')).toBe(false);
    });

    it('validates cashier role permissions', () => {
      // Allowed: patients, billing, dashboard
      expect(isRouteAllowed(ROUTES.PATIENTS, 'cashier')).toBe(true);
      expect(isRouteAllowed(ROUTES.BILLING, 'cashier')).toBe(true);
      expect(isRouteAllowed(ROUTES.DASHBOARD, 'cashier')).toBe(true);

      // Forbidden: nurse triage, doctor consultation, pharmacy, audit trail
      expect(isRouteAllowed(ROUTES.NURSE_TRIAGE, 'cashier')).toBe(false);
      expect(isRouteAllowed(ROUTES.DOCTOR_CONSULTATION, 'cashier')).toBe(false);
      expect(isRouteAllowed(ROUTES.PHARMACY_PRESCRIPTIONS, 'cashier')).toBe(false);
      expect(isRouteAllowed(ROUTES.AUDIT_TRAIL, 'cashier')).toBe(false);
    });
  });

  describe('getMenuInfoFromPath Navigation Mapping', () => {
    it('correctly maps /patients to patient-all with 3-tier breadcrumbs', () => {
      const info = getMenuInfoFromPath('/patients');
      expect(info.activeMenuId).toBe('patient-all');
      expect(info.activeMenuTitle).toBe('Data Pasien Rawat Jalan');
      expect(info.breadcrumbTrail).toEqual([
        { label: 'Layanan Pasien' },
        { label: 'Pendaftaran & Antrean' },
        { label: 'Data Pasien Rawat Jalan' },
      ]);
    });

    it('correctly maps /nurse/triage to nurse-triage with 2-tier breadcrumbs', () => {
      const info = getMenuInfoFromPath('/nurse/triage');
      expect(info.activeMenuId).toBe('nurse-triage');
      expect(info.activeMenuTitle).toBe('Skrining & Triage Nakes');
      expect(info.breadcrumbTrail).toEqual([
        { label: 'Layanan Pasien' },
        { label: 'Skrining & Triage Nakes' },
      ]);
    });

    it('correctly maps /audit-trail to audit-trail (admin only)', () => {
      const info = getMenuInfoFromPath('/audit-trail');
      expect(info.activeMenuId).toBe('audit-trail');
      expect(info.breadcrumbTrail).toEqual([
        { label: 'Master Data & Pengaturan' },
        { label: 'Audit Trail UU PDP' },
      ]);
    });

    it('gracefully handles unknown routes with fallback breadcrumb', () => {
      const info = getMenuInfoFromPath('/unknown-path');
      expect(info.activeMenuId).toBe('');
      expect(info.breadcrumbTrail).toEqual([{ label: 'Simple SIMRS' }]);
    });
  });
});
