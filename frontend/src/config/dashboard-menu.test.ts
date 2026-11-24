import { describe, it, expect } from 'vitest';
import { DASHBOARD_MENU, filterMenuByRole, isRoleAllowed } from './dashboard-menu';

describe('RBAC Navigation Menu Filtering', () => {
  it('allows admin role to access all menu items and groups', () => {
    const adminMenu = filterMenuByRole(DASHBOARD_MENU, 'admin');
    const allItemIds = adminMenu.flatMap((g) => g.items.flatMap((i) => [i.id, ...(i.children?.map((c) => c.id) || [])]));

    expect(allItemIds).toContain('nurse-triage');
    expect(allItemIds).toContain('doctor-consultation');
    expect(allItemIds).toContain('pharmacy-prescriptions');
    expect(allItemIds).toContain('laboratory');
    expect(allItemIds).toContain('billing');
    expect(allItemIds).toContain('audit-trail');
    expect(allItemIds).toContain('dashboard-analytics');
  });

  it('restricts nurse role: can see nurse-triage, but CANNOT see billing, pharmacy, or audit-trail', () => {
    const nurseMenu = filterMenuByRole(DASHBOARD_MENU, 'nurse');
    const itemIds = nurseMenu.flatMap((g) => g.items.flatMap((i) => [i.id, ...(i.children?.map((c) => c.id) || [])]));

    expect(itemIds).toContain('nurse-triage');
    expect(itemIds).not.toContain('doctor-consultation');
    expect(itemIds).not.toContain('pharmacy-prescriptions');
    expect(itemIds).not.toContain('billing');
    expect(itemIds).not.toContain('audit-trail');
  });

  it('restricts cashier role: can see billing and dashboard-analytics, but CANNOT see clinical consultation', () => {
    const cashierMenu = filterMenuByRole(DASHBOARD_MENU, 'cashier');
    const itemIds = cashierMenu.flatMap((g) => g.items.flatMap((i) => [i.id, ...(i.children?.map((c) => c.id) || [])]));

    expect(itemIds).toContain('billing');
    expect(itemIds).toContain('dashboard-analytics');
    expect(itemIds).not.toContain('doctor-consultation');
    expect(itemIds).not.toContain('nurse-triage');
    expect(itemIds).not.toContain('audit-trail');
  });

  it('correctly evaluates isRoleAllowed helper', () => {
    expect(isRoleAllowed(['admin', 'doctor'], 'doctor')).toBe(true);
    expect(isRoleAllowed(['admin', 'doctor'], 'cashier')).toBe(false);
    expect(isRoleAllowed(undefined, 'cashier')).toBe(true); // Public/all role if undefined
  });
});
