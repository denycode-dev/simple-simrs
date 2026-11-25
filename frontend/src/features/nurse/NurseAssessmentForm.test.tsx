import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NurseAssessmentForm } from './components/NurseAssessmentForm';
import { NurseQueueList } from './components/NurseQueueList';
import {
  detectActiveAllergy,
  evaluateBmi,
  evaluateVitalSign,
  validateTriageForm,
  isValidIcd10Code,
} from './utils/triage-helpers';
import * as apiModule from '@/lib/api-client';

describe('triage-helpers clinical logic', () => {
  it('evaluates BMI categories and non-color labels accurately', () => {
    expect(evaluateBmi(45, 170).evaluation.shortLabel).toBe('Underweight');
    expect(evaluateBmi(65, 170).evaluation.shortLabel).toBe('Normal');
    expect(evaluateBmi(80, 170).evaluation.shortLabel).toBe('Overweight');
    expect(evaluateBmi(95, 170).evaluation.shortLabel).toBe('Obesitas');
  });

  it('evaluates abnormal vital signs with explicit clinical labels', () => {
    expect(evaluateVitalSign('systolic', 150).shortLabel).toBe('Tinggi (Hipertensi)');
    expect(evaluateVitalSign('systolic', 118).shortLabel).toBe('Normal');
    expect(evaluateVitalSign('temp', 38.7).shortLabel).toBe('Demam Tinggi');
    expect(evaluateVitalSign('pulse', 115).shortLabel).toBe('Takikardia');
  });

  it('detects active allergy vs default negative strings', () => {
    expect(detectActiveAllergy('Tidak ada riwayat alergi obat/makanan')).toBe(false);
    expect(detectActiveAllergy('Nihil')).toBe(false);
    expect(detectActiveAllergy('Alergi Amoksisilin dan Udang')).toBe(true);
  });

  it('prevents invalid blood pressure order (systolic <= diastolic)', () => {
    const res = validateTriageForm({
      weightKg: 65,
      heightCm: 165,
      systolic: 80,
      diastolic: 90,
      pulseRate: 80,
      bodyTemp: 36.6,
      respiratoryRate: 18,
      chiefComplaint: 'Pusing',
      allergyHistory: 'Tidak ada',
    });
    expect(res.isValid).toBe(false);
    expect(res.bpOrderError).toMatch(/lebih besar daripada tekanan diastolik/i);
  });

  it('validates ICD-10 code pattern accurately', () => {
    expect(isValidIcd10Code('I10')).toBe(true);
    expect(isValidIcd10Code('E11.9')).toBe(true);
    expect(isValidIcd10Code('123')).toBe(false);
  });
});

describe('NurseAssessmentForm', () => {
  const mockRegistration = {
    id: 1,
    queue_number: 'INT-001',
    insurance_type: 'BPJS' as const,
    patient: {
      id: 1,
      name: 'Budi Santoso',
      medical_record_number: 'RM-202611-00001',
      gender: 'L' as const,
      birth_date: '1980-01-01',
    },
    polyclinic: { id: 1, name: 'Poliklinik Penyakit Dalam' },
    doctor: { id: 1, name: 'dr. Hendra Pratama, Sp.PD' },
  };

  it('renders streamlined nurse triage form and keeps allergy detail hidden until needed', () => {
    render(
      <NurseAssessmentForm
        registration={mockRegistration}
        onComplete={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText(/Skrining Triage/i)).toBeDefined();
    expect(screen.getByLabelText(/Tekanan Darah Sistolik/i)).toBeDefined();
    expect(screen.getByLabelText(/Tekanan Darah Diastolik/i)).toBeDefined();
    expect(screen.getByLabelText(/Frekuensi Nadi/i)).toBeDefined();
    expect(screen.getByLabelText(/Suhu Tubuh/i)).toBeDefined();
    expect(screen.getByLabelText(/Laju Pernapasan/i)).toBeDefined();
    expect(screen.getByLabelText(/Berat Badan/i)).toBeDefined();
    expect(screen.getByLabelText(/Tinggi Badan/i)).toBeDefined();
    expect(screen.getByLabelText(/Keluhan Utama/i)).toBeDefined();

    // Detail alergi disembunyikan saat status default "Tidak Ada"
    expect(screen.queryByLabelText(/Detail Alergi Obat \/ Makanan/i)).toBeNull();

    // Muncul ketika perawat memilih "Ada Alergi"
    fireEvent.click(screen.getByRole('radio', { name: /Ada Alergi/i }));
    expect(screen.getByLabelText(/Detail Alergi Obat \/ Makanan/i)).toBeDefined();
  });

  it('validates empty chief complaint inline on submit and submits cleanly once filled', async () => {
    const apiSpy = vi
      .spyOn(apiModule, 'apiClient')
      .mockResolvedValueOnce({ success: true });
    const onComplete = vi.fn();

    render(
      <NurseAssessmentForm
        registration={mockRegistration}
        onComplete={onComplete}
        onCancel={vi.fn()}
      />
    );

    const submitButton = screen.getByRole('button', {
      name: /Simpan & Teruskan ke Dokter/i,
    });

    fireEvent.click(submitButton);
    expect(
      screen.getByText(/Keluhan utama pasien wajib diisi/i)
    ).toBeDefined();
    expect(apiSpy).not.toHaveBeenCalled();

    const complaintInput = screen.getByLabelText(/Keluhan Utama/i);
    fireEvent.change(complaintInput, {
      target: { value: 'Demam dan batuk berdahak 3 hari' },
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiSpy).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('hides optional secondary fields by default (progressive disclosure) until expanded', () => {
    render(
      <NurseAssessmentForm
        registration={mockRegistration}
        onComplete={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const trigger = screen.getByText(/Riwayat Penyakit & Catatan Tambahan/i);
    expect(trigger).toBeDefined();

    fireEvent.click(trigger);
    expect(screen.getByLabelText(/Riwayat Penyakit Terdahulu/i)).toBeDefined();
    expect(screen.getByLabelText(/Catatan Khusus Perawat/i)).toBeDefined();
  });
});

describe('NurseQueueList', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('displays waiting triage patients with non-color status labels and recommended call button', async () => {
    vi.spyOn(apiModule, 'apiClient').mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 10,
          queue_number: 'INT-005',
          insurance_type: 'BPJS',
          registration_date: '2026-11-24',
          status: 'WAITING_NURSE',
          patient: {
            id: 2,
            name: 'Siti Aminah',
            medical_record_number: 'RM-202611-00009',
          },
          polyclinic: { id: 1, name: 'Poli Penyakit Dalam' },
          doctor: { id: 1, name: 'dr. Hendra Pratama, Sp.PD' },
        },
      ],
    });

    render(<NurseQueueList />);

    await waitFor(() => {
      expect(screen.getByText('Siti Aminah')).toBeDefined();
    });

    expect(screen.getByText('INT-005')).toBeDefined();
    expect(screen.getByText('Menunggu Dipanggil')).toBeDefined();
    expect(
      screen.getByRole('button', { name: /Panggil Berikutnya/i })
    ).toBeDefined();
  });
});
