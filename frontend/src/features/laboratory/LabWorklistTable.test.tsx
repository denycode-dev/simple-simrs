import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LabWorklistTable } from './components/LabWorklistTable';

const mockLabOrders = [
  {
    id: 1,
    order_number: 'LAB-20261124-0001',
    examination_id: 10,
    registration_id: 100,
    status: 'REQUESTED' as const,
    clinical_notes: 'Suspek anemia dan ISK',
    ordered_at: '2026-11-24 09:00:00',
    completed_at: null,
    patient_id: 5,
    patient_name: 'Budi Santoso',
    medical_record_number: 'RM-2026-0001',
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
        notes: null
      }
    ]
  },
  {
    id: 2,
    order_number: 'LAB-20261124-0002',
    examination_id: 11,
    registration_id: 101,
    status: 'COMPLETED' as const,
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
        status_flag: 'ABNORMAL' as const,
        tariff: 35000,
        notes: 'Pasien puasa 10 jam'
      }
    ]
  }
];

describe('LabWorklistTable', () => {
  it('renders lab orders list and shows red abnormal badge for abnormal result values', () => {
    const handleOpenResult = vi.fn();

    render(
      <LabWorklistTable
        orders={mockLabOrders}
        isLoading={false}
        onOpenResultModal={handleOpenResult}
      />
    );

    // Verify patient and order details
    expect(screen.getByText('LAB-20261124-0001')).toBeDefined();
    expect(screen.getByText('Budi Santoso')).toBeDefined();
    expect(screen.getByText('Siti Rahmawati')).toBeDefined();

    // Verify abnormal indicator
    expect(screen.getAllByText(/ABNORMAL/i).length).toBeGreaterThan(0);

    // Click button to input/view result
    const actionButtons = screen.getAllByRole('button', { name: /Hasil|Input/i });
    expect(actionButtons.length).toBeGreaterThan(0);
    fireEvent.click(actionButtons[0]);
    expect(handleOpenResult).toHaveBeenCalled();
  });
});
