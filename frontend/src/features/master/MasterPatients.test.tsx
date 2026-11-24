import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MasterPatientsPage } from './patients/MasterPatientsPage';

// Mock apiClient
vi.mock('@/lib/api-client', () => ({
  apiClient: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 1,
        medical_record_number: 'RM-202611-00001',
        nik: '320199**********',
        name: 'Siti Aminah',
        birth_date: '1990-05-12',
        gender: 'P',
        phone: '0812****7890',
        bpjs_number: '0001234567890',
      },
    ],
  }),
}));

describe('MasterPatientsPage', () => {
  it('renders patient master table with No RM, NIK, and Nama Pasien columns', async () => {
    render(<MasterPatientsPage />);
    expect(await screen.findByText('No. RM')).toBeDefined();
    expect(await screen.findByText('NIK')).toBeDefined();
    expect(await screen.findByText('Nama Pasien')).toBeDefined();
  });
});
