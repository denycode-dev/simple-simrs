import React, { useState } from 'react';
import { Card, Button, Input, Alert, Badge } from '@/components/ui';
import { apiClient } from '@/lib/api-client';

export interface NurseAssessmentRegistration {
  id: number;
  queue_number: string;
  patient?: {
    id: number;
    name: string;
    medical_record_number: string;
    gender?: 'L' | 'P';
    birth_date?: string;
  };
  polyclinic?: {
    id: number;
    name: string;
  };
  doctor?: {
    id: number;
    name: string;
  };
}

export interface NurseAssessmentFormProps {
  registration: NurseAssessmentRegistration;
  onComplete: () => void;
  onCancel: () => void;
}

export const NurseAssessmentForm: React.FC<NurseAssessmentFormProps> = ({
  registration,
  onComplete,
  onCancel,
}) => {
  // Antropometri
  const [weightKg, setWeightKg] = useState<string>('65');
  const [heightCm, setHeightCm] = useState<string>('165');

  // Tanda-tanda Vital (TTV)
  const [systolic, setSystolic] = useState<string>('120');
  const [diastolic, setDiastolic] = useState<string>('80');
  const [pulseRate, setPulseRate] = useState<string>('80');
  const [bodyTemp, setBodyTemp] = useState<string>('36.5');
  const [respiratoryRate, setRespiratoryRate] = useState<string>('18');

  // Anamnesis Awal Keperawatan
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [allergyHistory, setAllergyHistory] = useState<string>('Tidak ada riwayat alergi obat/makanan');
  const [diseaseHistory, setDiseaseHistory] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Kalkulasi Indeks Massa Tubuh (BMI)
  const weight = parseFloat(weightKg) || 0;
  const height = parseFloat(heightCm) || 0;
  const bmi = height > 0 ? (weight / Math.pow(height / 100, 2)).toFixed(1) : '-';

  // Usia estimasi jika ada tanggal lahir
  let ageYears = 30;
  if (registration.patient?.birth_date) {
    const birthYear = new Date(registration.patient.birth_date).getFullYear();
    const currentYear = new Date().getFullYear();
    if (!isNaN(birthYear)) {
      ageYears = Math.max(1, currentYear - birthYear);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!chiefComplaint.trim()) {
      setError('Keluhan utama pasien wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient('/nurse-assessments', {
        method: 'POST',
        body: JSON.stringify({
          registration_id: registration.id,
          nurse_id: 1, // ID perawat yang terotentikasi di poli
          weight_kg: Number(weightKg),
          height_cm: Number(heightCm),
          systolic: Number(systolic),
          diastolic: Number(diastolic),
          pulse_rate: Number(pulseRate),
          body_temp: Number(bodyTemp),
          respiratory_rate: Number(respiratoryRate),
          age_years: ageYears,
          gender: registration.patient?.gender || 'L',
          chief_complaint: chiefComplaint.trim(),
          allergy_history: allergyHistory.trim(),
          disease_history: diseaseHistory.trim(),
          notes: notes.trim(),
        }),
      });

      setSuccess('Asesmen awal berhasil disimpan. Status kunjungan diteruskan ke antrean dokter.');
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data asesmen keperawatan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card elevation="med" padding={6} style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
      {/* Header Banner Pasien */}
      <div
        style={{
          padding: 'var(--space-4)',
          backgroundColor: 'var(--color-primary-light)',
          border: '1px solid var(--color-primary-border)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: '1rem',
                color: 'var(--color-primary)',
                backgroundColor: 'var(--color-surface)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-primary-border)',
              }}
            >
              {registration.queue_number}
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>
              {registration.patient?.name}
            </h3>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            No. RM: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{registration.patient?.medical_record_number}</span> • {registration.patient?.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • Usia: ~{ageYears} tahun
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            {registration.polyclinic?.name}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            {registration.doctor?.name}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
          Skrining Awal Keperawatan (Triage)
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          Input pemeriksaan tanda-tanda vital, antropometri, keluhan utama, dan identifikasi riwayat alergi.
        </p>
      </div>

      {error && <div style={{ marginBottom: 'var(--space-4)' }}><Alert variant="danger">{error}</Alert></div>}
      {success && <div style={{ marginBottom: 'var(--space-4)' }}><Alert variant="success">{success}</Alert></div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {/* Antropometri & BMI */}
        <div>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 'var(--space-3)' }}>
            1. Data Fisik Antropometri
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
            <div>
              <Input
                id="weight_kg"
                label="Berat Badan (kg) *"
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                id="height_cm"
                label="Tinggi Badan (cm) *"
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-main)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Indeks Massa Tubuh (BMI)
              </label>
              <div
                style={{
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 var(--space-3)',
                  backgroundColor: 'var(--color-surface-hover)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  fontSize: '0.9375rem',
                }}
              >
                {bmi} kg/m²
                <span style={{ marginLeft: 'var(--space-2)' }}>
                  <Badge
                    variant={Number(bmi) < 18.5 ? 'warning' : Number(bmi) <= 24.9 ? 'success' : 'danger'}
                    label={Number(bmi) < 18.5 ? 'Underweight' : Number(bmi) <= 24.9 ? 'Normal' : 'Overweight'}
                  />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tanda-tanda Vital (TTV) */}
        <div style={{ paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)' }}>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 'var(--space-3)' }}>
            2. Tanda-Tanda Vital (TTV)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)' }}>
            <div>
              <Input
                id="systolic"
                label="Tekanan Darah Sistolik (mmHg) *"
                type="number"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                id="diastolic"
                label="Tekanan Darah Diastolik (mmHg) *"
                type="number"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                id="pulse_rate"
                label="Frekuensi Nadi (x/mnt) *"
                type="number"
                value={pulseRate}
                onChange={(e) => setPulseRate(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                id="body_temp"
                label="Suhu Tubuh (°C) *"
                type="text"
                value={bodyTemp}
                onChange={(e) => setBodyTemp(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                id="respiratory_rate"
                label="Laju Pernapasan / RR (x/mnt) *"
                type="number"
                value={respiratoryRate}
                onChange={(e) => setRespiratoryRate(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Anamnesis Awal & Alergi */}
        <div style={{ paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)' }}>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 'var(--space-3)' }}>
            3. Keluhan & Skrining Riwayat Pasien
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <label
                htmlFor="chief_complaint"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-main)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Keluhan Utama Pasien *
              </label>
              <textarea
                id="chief_complaint"
                rows={3}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="misal: Pasien mengeluh pusing berputar sejak 2 hari yang lalu disertai mual..."
                style={{
                  width: '100%',
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-main)',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label
                  htmlFor="allergy_history"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-danger-text)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  ⚠️ Riwayat Alergi (Obat / Makanan) *
                </label>
                <textarea
                  id="allergy_history"
                  rows={2}
                  value={allergyHistory}
                  onChange={(e) => setAllergyHistory(e.target.value)}
                  placeholder="Ketik 'Tidak Ada' atau sebutkan nama obat yang menimbulkan alergi..."
                  style={{
                    width: '100%',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-danger-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-main)',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                  }}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="disease_history"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-text-main)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Riwayat Penyakit Terdahulu
                </label>
                <textarea
                  id="disease_history"
                  rows={2}
                  value={diseaseHistory}
                  onChange={(e) => setDiseaseHistory(e.target.value)}
                  placeholder="misal: Hipertensi terkontrol, Asma saat anak-anak..."
                  style={{
                    width: '100%',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-main)',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            <div>
              <Input
                id="notes"
                label="Catatan Khusus Perawat"
                placeholder="Catatan tambahan untuk dokter pemeriksa..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-2)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--color-border-subtle)',
          }}
        >
          <Button
            type="button"
            variant="secondary"
            size="md"
            label="Batal / Kembali"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Batal / Kembali
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            label="Simpan & Teruskan ke Dokter Poli"
            isLoading={isSubmitting}
          >
            Simpan & Teruskan ke Dokter Poli
          </Button>
        </div>
      </form>
    </Card>
  );
};
