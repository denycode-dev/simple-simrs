import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrescriptionDispenseModal } from './components/PrescriptionDispenseModal';

describe('PrescriptionDispenseModal', () => {
  it('renders prescription dispense confirmation modal with medicine list and confirm button', () => {
    const mockPrescription = {
      id: 1,
      prescription_number: 'RX-202611-00001',
      patient_name: 'Budi Santoso',
      medical_record_number: 'RM-202611-00001',
      doctor_name: 'dr. Hendra Pratama, Sp.PD',
      total_price: 45000,
      status: 'PENDING' as const,
      created_at: '2026-11-24 08:30:00',
      items: [
        {
          id: 1,
          medicine_name: 'Paracetamol 500mg',
          quantity: 10,
          dosage: '3x1 tablet sesudah makan',
          subtotal: 15000,
        },
      ],
    };

    render(
      <PrescriptionDispenseModal
        prescription={mockPrescription}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText(/Telaah & Penyerahan Obat Farmasi/i)).toBeDefined();
    expect(screen.getByText('RX-202611-00001')).toBeDefined();
    expect(screen.getByText('Paracetamol 500mg')).toBeDefined();
    expect(screen.getByText(/3x1 tablet sesudah makan/i)).toBeDefined();
    expect(screen.getByText(/Konfirmasi & Serahkan Obat/i)).toBeDefined();
  });
});
