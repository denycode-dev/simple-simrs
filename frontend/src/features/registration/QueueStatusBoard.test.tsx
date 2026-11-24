import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueueStatusBoard } from './components/QueueStatusBoard';

// Mock apiClient
vi.mock('@/lib/api-client', () => ({
  apiClient: vi.fn().mockImplementation((endpoint: string) => {
    if (endpoint.includes('/registrations')) {
      return Promise.resolve({
        success: true,
        data: [
          {
            id: 1,
            queue_number: 'INT-001',
            queue_sequence: 1,
            patient: { id: 1, name: 'Budi Santoso', medical_record_number: 'RM-202611-00001' },
            polyclinic: { id: 1, name: 'Poliklinik Penyakit Dalam' },
            doctor: { id: 1, name: 'dr. Hendra Pratama, Sp.PD' },
            insurance_type: 'GENERAL',
            status: 'WAITING_NURSE',
            registration_date: '2026-11-24',
          },
        ],
      });
    }
    if (endpoint.includes('/polyclinics')) {
      return Promise.resolve({
        success: true,
        data: [{ id: 1, name: 'Poliklinik Penyakit Dalam' }],
      });
    }
    return Promise.resolve({ success: true, data: [] });
  }),
}));

describe('QueueStatusBoard', () => {
  it('renders live queue board with queue number and current status', async () => {
    render(<QueueStatusBoard />);
    expect(await screen.findByText('Papan Antrean Rawat Jalan')).toBeDefined();
    expect(await screen.findByText('INT-001')).toBeDefined();
    expect(await screen.findByText(/Menunggu Skrining Nakes/i)).toBeDefined();
  });
});
