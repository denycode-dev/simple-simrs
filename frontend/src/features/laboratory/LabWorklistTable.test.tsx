import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LabWorklistTable } from './components/LabWorklistTable';
import { LabResultModal, type LabOrderDetail } from './components/LabResultModal';
import { LabOrderModal } from './components/LabOrderModal';
import { LaboratoryPage } from './LaboratoryPage';
import * as apiModule from '@/lib/api-client';
import * as authModule from '@/features/auth';

const mockLabOrders: LabOrderDetail[] = [
  {
    id: 1,
    order_number: 'LAB-20261124-0001',
    examination_id: 10,
    registration_id: 100,
    status: 'REQUESTED',
    clinical_notes: 'Suspek anemia dan ISK',
    ordered_at: '2026-11-24 09:00:00',
    completed_at: null,
    patient_id: 5,
    patient_name: 'Budi Santoso',
    medical_record_number: 'RM-2026-0001',
    patient_nik_masked: '320101******0001',
    doctor_id: 2,
    doctor_name: 'dr. Andi Pratama, Sp.PD',
    polyclinic_name: 'Poli Penyakit Dalam',
    items: [
      {
        id: 101,
        test_name: 'Hemoglobin (Hb)',
        test_code: 'HB01',
        result_value: null,
        reference_range: '13.0 - 17.0',
        unit: 'g/dL',
        status_flag: null,
        tariff: 45000,
        notes: null,
      },
    ],
  },
  {
    id: 2,
    order_number: 'LAB-20261124-0002',
    examination_id: 11,
    registration_id: 101,
    status: 'COMPLETED',
    clinical_notes: 'Cek profil glukosa puasa',
    ordered_at: '2026-11-24 08:30:00',
    completed_at: '2026-11-24 09:45:00',
    patient_id: 6,
    patient_name: 'Siti Rahmawati',
    medical_record_number: 'RM-2026-0002',
    doctor_id: 3,
    doctor_name: 'dr. Citra Lestari, Sp.A',
    polyclinic_name: 'Poli Anak',
    items: [
      {
        id: 102,
        test_name: 'Glukosa Puasa',
        test_code: 'GLU01',
        result_value: '220',
        reference_range: '70 - 100',
        unit: 'mg/dL',
        status_flag: 'ABNORMAL',
        tariff: 35000,
        notes: 'Pasien puasa 10 jam',
      },
    ],
  },
];

describe('LabWorklistTable', () => {
  it('renders lab orders list and shows abnormal indicator for abnormal result values', () => {
    const handleOpenResult = vi.fn();

    render(
      <LabWorklistTable
        orders={mockLabOrders}
        isLoading={false}
        onOpenResultModal={handleOpenResult}
      />
    );

    expect(screen.getByText('LAB-20261124-0001')).toBeDefined();
    expect(screen.getByText('Budi Santoso')).toBeDefined();
    expect(screen.getByText('Siti Rahmawati')).toBeDefined();
    expect(screen.getAllByText(/ABNORMAL/i).length).toBeGreaterThan(0);

    const actionButtons = screen.getAllByRole('button', { name: /Hasil|Input/i });
    expect(actionButtons.length).toBeGreaterThan(0);
    fireEvent.click(actionButtons[0]);
    expect(handleOpenResult).toHaveBeenCalled();
  });
});

describe('LabResultModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: { id: '6', name: 'Analis Lab', username: 'lab', role: 'lab' },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('fetches order detail, submits results with completed_by and status_flag, and supports status transition', async () => {
    const apiSpy = vi
      .spyOn(apiModule, 'apiClient')
      .mockImplementation((async (url: string, opts?: apiModule.RequestOptions) => {
        if (url.endsWith('/laboratory/orders/1') && !opts?.method) {
          return { success: true, data: mockLabOrders[0] };
        }
        return { success: true, data: { ...mockLabOrders[0], status: 'COMPLETED' } };
      }) as typeof apiModule.apiClient);

    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <LabResultModal
        isOpen={true}
        order={mockLabOrders[0]}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith(
        expect.stringContaining('/laboratory/orders/1')
      );
    });

    const resultInput = screen.getByLabelText(/Hasil Hemoglobin/i);
    fireEvent.change(resultInput, { target: { value: '14.6' } });

    const noteInput = screen.getByLabelText(/Catatan Hemoglobin/i);
    fireEvent.change(noteInput, { target: { value: 'Dalam batas rujukan normal' } });

    fireEvent.click(
      screen.getByRole('button', { name: /Simpan & Verifikasi Hasil/i })
    );

    await waitFor(() => {
      const postCalls = apiSpy.mock.calls.filter(
        ([url, opts]) =>
          String(url).includes('/laboratory/orders/1/results') &&
          opts?.method === 'POST'
      );
      expect(postCalls).toHaveLength(1);
      const body = JSON.parse(String(postCalls[0][1]?.body));
      expect(body).toEqual({
        completed_by: 6,
        items: [
          {
            id: 101,
            result_value: '14.6',
            reference_range: '13.0 - 17.0',
            unit: 'g/dL',
            status_flag: 'NORMAL',
            notes: 'Dalam batas rujukan normal',
          },
        ],
      });
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

describe('LabOrderModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads examinations dynamically when opened from /laboratory and posts real registration_id & examination_id', async () => {
    const apiSpy = vi
      .spyOn(apiModule, 'apiClient')
      .mockImplementation((async (url: string, opts?: apiModule.RequestOptions) => {
        if (url === '/examinations') {
          return {
            data: [
              {
                id: 69,
                registration_id: 135,
                primary_diagnosis_code: 'J06.9',
                doctor: { id: 1, name: 'dr. Hendra' },
                registration: {
                  id: 135,
                  queue_number: 'INT-012',
                  status: 'IN_DOCTOR',
                  patient: {
                    id: 10,
                    name: 'Dewi Lestari',
                    medical_record_number: 'RM-202611-00088',
                  },
                },
              },
            ],
          };
        }
        if (String(url).includes('/laboratory/orders') && opts?.method === 'POST') {
          return { success: true, data: { id: 99 } };
        }
        return { data: [] };
      }) as typeof apiModule.apiClient);

    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(<LabOrderModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />);

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledWith('/examinations');
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /Hemoglobin \(Hb\)/i }));
    fireEvent.change(screen.getByLabelText(/Indikasi Klinis/i), {
      target: { value: 'Evaluasi anemia' },
    });
    fireEvent.change(screen.getByLabelText(/Catatan Sampel: Hemoglobin/i), {
      target: { value: 'Darah EDTA' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Kirim Permintaan Lab/i })
    );

    await waitFor(() => {
      const postCalls = apiSpy.mock.calls.filter(
        ([url, opts]) =>
          String(url).includes('/laboratory/orders') && opts?.method === 'POST'
      );
      expect(postCalls).toHaveLength(1);
      const payload = JSON.parse(String(postCalls[0][1]?.body));
      expect(payload).toEqual({
        registration_id: 135,
        examination_id: 69,
        clinical_notes: 'Evaluasi anemia',
        items: [
          {
            test_name: 'Hemoglobin (Hb)',
            test_code: 'HB01',
            reference_range: '13.0 - 17.0',
            unit: 'g/dL',
            tariff: 45000,
            notes: 'Darah EDTA',
          },
        ],
      });
    });
  });
});

describe('LaboratoryPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: { id: '6', name: 'Analis Lab', username: 'lab', role: 'lab' },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('fetches orders via apiClient with status/limit params and supports starting processing via PATCH /status', async () => {
    const apiSpy = vi
      .spyOn(apiModule, 'apiClient')
      .mockImplementation((async (url: string, opts?: apiModule.RequestOptions) => {
        if (String(url).endsWith('/laboratory/orders') && !opts?.method) {
          return {
            success: true,
            data: mockLabOrders,
            meta: { limit: 20, count: 2, next_cursor: null },
          };
        }
        return { success: true, data: { id: 1, status: 'IN_PROGRESS' } };
      }) as typeof apiModule.apiClient);

    render(<LaboratoryPage />);

    await waitFor(() => {
      expect(screen.getByText('LAB-20261124-0001')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /^Proses$/i }));

    await waitFor(() => {
      const patchCalls = apiSpy.mock.calls.filter(
        ([url, opts]) =>
          String(url).includes('/laboratory/orders/1/status') &&
          opts?.method === 'PATCH'
      );
      expect(patchCalls).toHaveLength(1);
      expect(JSON.parse(String(patchCalls[0][1]?.body))).toMatchObject({
        status: 'IN_PROGRESS',
      });
    });
  });
});
