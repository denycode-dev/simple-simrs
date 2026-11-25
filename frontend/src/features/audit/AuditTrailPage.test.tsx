import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditTrailTable } from './components/AuditTrailTable';

const mockLogs = [
  {
    id: 1,
    user_id: 1,
    action: 'UNMASK_DATA',
    module: 'PATIENT',
    record_id: 10,
    old_values: null,
    new_values: { field: 'nik', reason: 'Klinis' },
    ip_address: '192.168.1.105',
    user_agent: 'Mozilla/5.0 Chrome',
    created_at: '2026-11-24 09:30:15',
    user: {
      id: 1,
      username: 'admin',
      name: 'Administrator RS',
      role: 'admin',
    },
  },
  {
    id: 2,
    user_id: 2,
    action: 'DISPENSE',
    module: 'PHARMACY',
    record_id: 45,
    old_values: { status: 'PENDING' },
    new_values: { status: 'DISPENSED' },
    ip_address: '192.168.1.110',
    user_agent: 'Mozilla/5.0 Firefox',
    created_at: '2026-11-24 09:45:20',
    user: {
      id: 2,
      username: 'farmasi1',
      name: 'Apt. Rina Marlina',
      role: 'pharmacist',
    },
  },
];

describe('AuditTrailTable', () => {
  it('renders audit trail table with action, module, username, ip address, and timestamp', () => {
    render(<AuditTrailTable logs={mockLogs} isLoading={false} />);

    expect(screen.getAllByText('UNMASK_DATA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('DISPENSE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PATIENT').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PHARMACY').length).toBeGreaterThan(0);
    expect(screen.getByText('Administrator RS')).toBeDefined();
    expect(screen.getByText('Apt. Rina Marlina')).toBeDefined();
    expect(screen.getByText('192.168.1.105')).toBeDefined();
    expect(screen.getByText('192.168.1.110')).toBeDefined();
    expect(screen.getByText('2026-11-24 09:30:15')).toBeDefined();
  });

  it('opens scrollable detail dialog showing old_values and new_values', () => {
    render(<AuditTrailTable logs={mockLogs} isLoading={false} />);

    const detailButtons = screen.getAllByRole('button', { name: /Lihat Detail/i });
    fireEvent.click(detailButtons[0]);

    expect(screen.getByText(/Detail Jejak Audit #1/i)).toBeDefined();
    expect(screen.getByText(/Nilai Sebelum \(Old Values\)/i)).toBeDefined();
    expect(screen.getByText(/Nilai Sesudah \(New Values\)/i)).toBeDefined();
  });
});
