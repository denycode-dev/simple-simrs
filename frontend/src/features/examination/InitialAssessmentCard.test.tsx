import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InitialAssessmentCard } from './components/InitialAssessmentCard';
import { DoctorExaminationForm } from './components/DoctorExaminationForm';
import * as apiModule from '@/lib/api-client';

describe('InitialAssessmentCard', () => {
  it('renders nurse initial assessment summary with vital signs and allergy alert', () => {
    const mockAssessment = {
      id: 1,
      weight_kg: 68,
      height_cm: 170,
      systolic: 130,
      diastolic: 85,
      pulse_rate: 82,
      body_temp: 36.8,
      respiratory_rate: 19,
      chief_complaint: 'Pusing dan leher kaku sejak pagi',
      allergy_history: 'Alergi Penisilin dan Seafood',
      disease_history: 'Hipertensi 2 tahun',
      notes: 'Pasien tampak cemas',
    };

    render(<InitialAssessmentCard assessment={mockAssessment} />);

    expect(screen.getByText(/Informasi Skrining Awal Nakes/i)).toBeDefined();
    expect(screen.getByText(/130\/85/)).toBeDefined();
    expect(screen.getByText(/Alergi Penisilin dan Seafood/i)).toBeDefined();
    expect(screen.getByText(/Pusing dan leher kaku/i)).toBeDefined();
    expect(screen.getByText(/36\.8/)).toBeDefined();
    expect(screen.getByText(/Pra-Hipertensi/i)).toBeDefined();
  });

  it('reveals secondary anthropometry and nurse notes on progressive disclosure expand', () => {
    const mockAssessment = {
      id: 2,
      weight_kg: 70,
      height_cm: 175,
      systolic: 118,
      diastolic: 78,
      pulse_rate: 76,
      body_temp: 36.5,
      respiratory_rate: 18,
      chief_complaint: 'Kontrol rutin tekanan darah',
      allergy_history: 'Tidak ada riwayat alergi obat/makanan',
      disease_history: 'Hipertensi terkontrol',
      notes: 'Datang tepat waktu',
    };

    render(<InitialAssessmentCard assessment={mockAssessment} />);

    expect(screen.getByText('Alergi Negatif')).toBeDefined();
    expect(screen.getByText('Seluruh TTV Normal')).toBeDefined();

    const secondaryTrigger = screen.getByText(/Detail Sekunder: Antropometri/i);
    fireEvent.click(secondaryTrigger);

    expect(screen.getByText('Hipertensi terkontrol')).toBeDefined();
    expect(screen.getByText('Datang tepat waktu')).toBeDefined();
  });
});

function createWorkspaceApiMock() {
  return vi
    .spyOn(apiModule, 'apiClient')
    .mockImplementation((async (endpoint: string) => {
      if (endpoint === '/registrations') {
        return {
          data: [
            {
              id: 21,
              queue_number: 'INT-011',
              insurance_type: 'BPJS',
              registration_date: '2026-11-24',
              status: 'WAITING_DOCTOR',
              patient: {
                id: 5,
                name: 'Ahmad Fauzi',
                medical_record_number: 'RM-202611-00021',
                gender: 'L',
                birth_date: '1975-06-15',
              },
              polyclinic: { id: 1, name: 'Poliklinik Penyakit Dalam' },
              doctor: { id: 3, name: 'dr. Hendra Pratama, Sp.PD' },
            },
          ],
        };
      }
      if (endpoint === '/medical-actions') {
        return {
          data: [
            {
              id: 101,
              code: 'ACT-01',
              name: 'Konsultasi Dokter Spesialis',
              category: 'Pemeriksaan',
              tariff: 150000,
            },
          ],
        };
      }
      if (endpoint === '/medicines') {
        return {
          data: [
            {
              id: 1,
              code: 'OBT-001',
              name: 'Paracetamol 500 mg',
              category: 'Analgesik',
              unit: 'tablet',
              stock: 50,
              unit_price: 1000,
              is_active: true,
            },
          ],
        };
      }
      if (endpoint === '/nurse-assessments') {
        return {
          data: [
            {
              id: 9,
              weight_kg: 72,
              height_cm: 168,
              systolic: 145,
              diastolic: 92,
              pulse_rate: 84,
              body_temp: 36.7,
              respiratory_rate: 18,
              chief_complaint: 'Tengkuk terasa berat',
              allergy_history: 'Tidak ada alergi',
            },
          ],
        };
      }
      return { data: { id: 500 } };
    }) as typeof apiModule.apiClient);
}

describe('DoctorExaminationForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders consultation queue, opens SOAP form with 1-click next patient action, and updates single commit action by destination', async () => {
    const apiSpy = createWorkspaceApiMock();

    render(<DoctorExaminationForm />);

    await waitFor(() => {
      expect(screen.getByText('Ahmad Fauzi')).toBeDefined();
    });

    const startBtn = screen.getByRole('button', {
      name: /Periksa Antrean Berikutnya/i,
    });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(screen.getByText('Tengkuk terasa berat')).toBeDefined();
    });

    expect(
      screen.getByRole('button', { name: /Simpan RME & Teruskan ke Farmasi/i })
    ).toBeDefined();

    const billingRadio = screen.getByRole('radio', {
      name: /Langsung ke Kasir \/ Billing/i,
    });
    fireEvent.click(billingRadio);

    expect(
      screen.getByRole('button', { name: /Simpan RME & Teruskan ke Kasir/i })
    ).toBeDefined();

    const icdInput = screen.getByLabelText(/Kode ICD-10 Utama/i);
    fireEvent.change(icdInput, { target: { value: '' } });

    const commitBtn = screen.getByRole('button', {
      name: /Simpan RME & Teruskan ke Kasir/i,
    });
    expect(commitBtn.getAttribute('aria-disabled')).toBe('true');

    expect(apiSpy).toHaveBeenCalled();
  });

  it('submits atomic POST /examinations payload with actions, prescription_items, and next_status, and auto-switches BILLING to PHARMACY when adding medicine', async () => {
    const apiSpy = createWorkspaceApiMock();

    render(<DoctorExaminationForm />);

    await waitFor(() => {
      expect(screen.getByText('Ahmad Fauzi')).toBeDefined();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Periksa Antrean Berikutnya/i })
    );

    await waitFor(() => {
      expect(screen.getByText('Tengkuk terasa berat')).toBeDefined();
    });

    // Isi pemeriksaan fisik, diagnosis (via preset J06.9), komorbiditas, dan catatan dokter
    fireEvent.change(screen.getByLabelText(/Temuan Pemeriksaan Fisik/i), {
      target: { value: 'Faring hiperemis (+), tonsil T1/T1' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'J06.9' }));

    fireEvent.click(screen.getByText(/Diagnosis Sekunder \/ Komorbiditas/i));
    fireEvent.change(screen.getByLabelText(/Diagnosis Sekunder/i), {
      target: { value: 'Faringitis akut' },
    });

    fireEvent.change(screen.getByLabelText(/Catatan & Edukasi Dokter/i), {
      target: { value: 'Istirahat cukup, minum air hangat' },
    });

    // Pilih tindakan medis + catatannya
    fireEvent.click(screen.getByText(/Tindakan Medis Poliklinik/i));
    fireEvent.click(
      screen.getByRole('checkbox', { name: /Konsultasi Dokter Spesialis/i })
    );
    fireEvent.change(
      screen.getByLabelText(/Catatan Tindakan: Konsultasi Dokter Spesialis/i),
      { target: { value: 'Konsultasi dan pemeriksaan dokter umum' } }
    );

    // Pilih Kasir dulu lalu tambahkan obat -> harus otomatis pindah ke Farmasi dan disable Kasir
    const billingRadio = screen.getByRole('radio', {
      name: /Langsung ke Kasir \/ Billing/i,
    });
    fireEvent.click(billingRadio);

    fireEvent.click(screen.getByRole('button', { name: /\+ Tambah Obat/i }));

    expect(
      (screen.getByRole('radio', { name: /Teruskan ke Instalasi Farmasi/i }) as HTMLInputElement)
        .checked
    ).toBe(true);
    expect((billingRadio as HTMLInputElement).disabled).toBe(true);

    // Sesuaikan jumlah, dosis, aturan pakai, dan instruksi obat
    const qtyInput = screen.getByRole('spinbutton', { name: /Jumlah/i });
    fireEvent.change(qtyInput, { target: { value: '6' } });
    fireEvent.blur(qtyInput);

    fireEvent.change(screen.getByLabelText(/^Dosis/i), {
      target: { value: '500 mg' },
    });
    fireEvent.change(screen.getByLabelText(/Aturan Pakai/i), {
      target: { value: '3x1 tablet sesudah makan' },
    });
    fireEvent.change(screen.getByLabelText(/^Instruksi/i), {
      target: { value: 'Bila demam atau nyeri' },
    });

    // Submit form
    fireEvent.click(
      screen.getByRole('button', { name: /Simpan RME & Teruskan ke Farmasi/i })
    );

    await waitFor(() => {
      const postExamCalls = apiSpy.mock.calls.filter(
        ([url, opts]) => url === '/examinations' && opts?.method === 'POST'
      );
      expect(postExamCalls).toHaveLength(1);

      const submittedBody = JSON.parse(String(postExamCalls[0][1]?.body));
      expect(submittedBody).toEqual({
        registration_id: 21,
        doctor_id: 3,
        physical_exam: 'Faring hiperemis (+), tonsil T1/T1',
        primary_diagnosis_code: 'J06.9',
        primary_diagnosis_desc:
          'Infeksi saluran pernapasan akut atas, tidak spesifik (ISPA)',
        secondary_diagnosis: 'Faringitis akut',
        doctor_notes: 'Istirahat cukup, minum air hangat',
        next_status: 'PHARMACY',
        actions: [
          {
            action_id: 101,
            notes: 'Konsultasi dan pemeriksaan dokter umum',
          },
        ],
        prescription_items: [
          {
            medicine_id: 1,
            quantity: 6,
            dosage: '500 mg',
            frequency: '3x1 tablet sesudah makan',
            instructions: 'Bila demam atau nyeri',
          },
        ],
      });
    });

    // Pastikan tidak ada lagi pemanggilan terpisah ke /actions atau PATCH /status
    const legacyCalls = apiSpy.mock.calls.filter(
      ([url]) =>
        String(url).includes('/examinations/') || String(url).includes('/status')
    );
    expect(legacyCalls).toHaveLength(0);
  });
});
