import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentModal } from './components/PaymentModal';

const mockBilling = {
  id: 1,
  registration_id: 10,
  invoice_number: 'INV-20261124-0001',
  insurance_type: 'GENERAL' as const,
  total_registration_fee: 25000,
  total_actions_fee: 50000,
  total_medicines_fee: 45000,
  total_lab_fee: 35000,
  total_amount: 155000,
  covered_by_bpjs: 0,
  patient_payable: 155000,
  payment_status: 'UNPAID' as const,
  registration: {
    patient: {
      name: 'Budi Santoso',
      medical_record_number: 'RM-2026-0001',
    },
    polyclinic: {
      name: 'Poli Penyakit Dalam',
    },
    doctor: {
      name: 'dr. Andi Pratama, Sp.PD',
    },
    queue_number: 'A-001',
  },
};

const mockBpjsBilling = {
  ...mockBilling,
  id: 2,
  invoice_number: 'INV-20261124-0002',
  insurance_type: 'BPJS' as const,
  covered_by_bpjs: 155000,
  patient_payable: 0,
};

describe('PaymentModal', () => {
  it('calculates change amount automatically when cash amount received is inputted', () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <PaymentModal
        isOpen={true}
        billing={mockBilling}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    // Verify invoice info is rendered
    expect(screen.getByText('INV-20261124-0001')).toBeDefined();
    expect(screen.getByText('Budi Santoso')).toBeDefined();

    // Input cash amount received: 200,000 (total due 155,000 -> change should be 45,000)
    const amountInput = screen.getByLabelText(/Uang Diterima/i);
    fireEvent.change(amountInput, { target: { value: '200000' } });

    // Verify change amount is displayed
    expect(screen.getAllByText(/45.000/i).length).toBeGreaterThan(0);
  });

  it('displays zero out-of-pocket and BPJS coverage banner when billing is BPJS', () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <PaymentModal
        isOpen={true}
        billing={mockBpjsBilling}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    // Verify BPJS coverage message
    expect(screen.getByText(/Ditanggung Penuh BPJS/i)).toBeDefined();
    expect(screen.getAllByText(/Rp 0/i).length).toBeGreaterThan(0);
  });
});
