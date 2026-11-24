import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RegistrationForm } from './components/RegistrationForm';

// Mock apiClient
vi.mock('@/lib/api-client', () => ({
  apiClient: vi.fn().mockImplementation((endpoint: string) => {
    if (endpoint.includes('/patients')) {
      return Promise.resolve({
        success: true,
        data: [{ id: 1, name: 'Budi Santoso', medical_record_number: 'RM-202611-00001', nik: '3201990000000001', bpjs_number: '0001234567890' }],
      });
    }
    if (endpoint.includes('/polyclinics')) {
      return Promise.resolve({
        success: true,
        data: [{ id: 1, code: 'INT', name: 'Poliklinik Penyakit Dalam', is_active: true }],
      });
    }
    if (endpoint.includes('/doctors')) {
      return Promise.resolve({
        success: true,
        data: [{ id: 1, name: 'dr. Hendra Pratama, Sp.PD', specialization: 'Spesialis Penyakit Dalam' }],
      });
    }
    if (endpoint.includes('/doctor-schedules')) {
      return Promise.resolve({
        success: true,
        data: [{ id: 1, doctor_id: 1, polyclinic_id: 1, day_of_week: 'Senin', start_time: '08:00', end_time: '12:00', quota: 30 }],
      });
    }
    return Promise.resolve({ success: true, data: [] });
  }),
}));

describe('RegistrationForm', () => {
  it('renders patient registration form with breadcrumbs, steps, and insurance selectable cards', async () => {
    render(<RegistrationForm />);
    expect(await screen.findByText('Formulir Pendaftaran Rawat Jalan')).toBeDefined();
    expect(await screen.findByText('Layanan Pasien')).toBeDefined();
    expect(await screen.findByText('Pendaftaran Kunjungan')).toBeDefined();
    expect(await screen.findByText(/Pilih Jenis Penjamin/i)).toBeDefined();
    expect(await screen.findByText('Ringkasan Kunjungan')).toBeDefined();

    const generalOptions = await screen.findAllByText(/Umum/i);
    expect(generalOptions.length).toBeGreaterThan(0);
    const bpjsOptions = await screen.findAllByText(/BPJS Kesehatan/i);
    expect(bpjsOptions.length).toBeGreaterThan(0);

    // Verify submit button is rendered
    expect(await screen.findByText(/Daftarkan & Terbitkan Karcis Antrean/i)).toBeDefined();
  });
});
