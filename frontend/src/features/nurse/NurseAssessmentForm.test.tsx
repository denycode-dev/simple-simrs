import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NurseAssessmentForm } from './components/NurseAssessmentForm';

describe('NurseAssessmentForm', () => {
  it('renders nurse triage form with vital signs, anthropometry, complaint, and allergy fields', () => {
    const mockRegistration = {
      id: 1,
      queue_number: 'INT-001',
      patient: { id: 1, name: 'Budi Santoso', medical_record_number: 'RM-202611-00001', gender: 'L' as const, birth_date: '1980-01-01' },
      polyclinic: { id: 1, name: 'Poliklinik Penyakit Dalam' },
      doctor: { id: 1, name: 'dr. Hendra Pratama, Sp.PD' },
    };

    render(<NurseAssessmentForm registration={mockRegistration} onComplete={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText(/Skrining Awal Keperawatan \(Triage\)/i)).toBeDefined();
    expect(screen.getByLabelText(/Tekanan Darah Sistolik/i)).toBeDefined();
    expect(screen.getByLabelText(/Tekanan Darah Diastolik/i)).toBeDefined();
    expect(screen.getByLabelText(/Frekuensi Nadi/i)).toBeDefined();
    expect(screen.getByLabelText(/Suhu Tubuh/i)).toBeDefined();
    expect(screen.getByLabelText(/Laju Pernapasan/i)).toBeDefined();
    expect(screen.getByLabelText(/Berat Badan/i)).toBeDefined();
    expect(screen.getByLabelText(/Tinggi Badan/i)).toBeDefined();
    expect(screen.getByLabelText(/Keluhan Utama/i)).toBeDefined();
    expect(screen.getByLabelText(/Riwayat Alergi/i)).toBeDefined();
  });
});
