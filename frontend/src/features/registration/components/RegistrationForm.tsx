import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Alert } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { QueueTicketModal, type QueueTicketData } from './QueueTicketModal';

interface PatientOption {
  id: number;
  name: string;
  medical_record_number: string;
  nik: string;
  bpjs_number?: string;
}

interface PolyclinicOption {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
}

interface DoctorOption {
  id: number;
  name: string;
  specialization: string;
}

interface DoctorScheduleOption {
  id: number;
  doctor_id: number;
  polyclinic_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  quota: number;
}

interface RegistrationApiResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    queue_number: string;
    queue_sequence: number;
    patient_id: number;
    polyclinic_id: number;
    doctor_id: number;
    schedule_id: number;
    insurance_type: 'GENERAL' | 'BPJS';
    registration_date: string;
    status: string;
  };
}

export const RegistrationForm: React.FC = () => {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [polyclinics, setPolyclinics] = useState<PolyclinicOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [schedules, setSchedules] = useState<DoctorScheduleOption[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form Fields
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedPoliId, setSelectedPoliId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [insuranceType, setInsuranceType] = useState<'GENERAL' | 'BPJS'>('GENERAL');
  const [patientSearch, setPatientSearch] = useState<string>('');

  // Submit & Ticket State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<QueueTicketData | null>(null);

  // Zero waterfall parallel fetching
  const loadMasterData = useCallback(async () => {
    setIsLoadingMaster(true);
    setLoadError(null);
    try {
      const [patRes, poliRes, docRes, schedRes] = await Promise.all([
        apiClient<{ data: PatientOption[] }>('/patients'),
        apiClient<{ data: PolyclinicOption[] }>('/polyclinics'),
        apiClient<{ data: DoctorOption[] }>('/doctors'),
        apiClient<{ data: DoctorScheduleOption[] }>('/doctor-schedules'),
      ]);

      setPatients(Array.isArray(patRes.data) ? patRes.data : []);
      setPolyclinics(Array.isArray(poliRes.data) ? poliRes.data : []);
      setDoctors(Array.isArray(docRes.data) ? docRes.data : []);
      setSchedules(Array.isArray(schedRes.data) ? schedRes.data : []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Gagal memuat master data pendaftaran.');
    } finally {
      setIsLoadingMaster(false);
    }
  }, []);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  // Filter schedules based on selected poli and doctor
  const availableSchedules = schedules.filter((s) => {
    if (selectedPoliId && s.polyclinic_id !== Number(selectedPoliId)) return false;
    if (selectedDoctorId && s.doctor_id !== Number(selectedDoctorId)) return false;
    return true;
  });

  // Selected patient details
  const selectedPatient = patients.find((p) => String(p.id) === selectedPatientId);

  // Filtered patients for dropdown/search
  const filteredPatients = patients.filter((p) => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.medical_record_number.toLowerCase().includes(q) ||
      p.nik.includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedPatientId) {
      setSubmitError('Silakan pilih pasien yang akan didaftarkan.');
      return;
    }
    if (!selectedPoliId) {
      setSubmitError('Silakan pilih poliklinik tujuan.');
      return;
    }
    if (!selectedDoctorId) {
      setSubmitError('Silakan pilih dokter spesialis DPJP.');
      return;
    }
    if (!selectedScheduleId) {
      setSubmitError('Silakan pilih jadwal praktik dokter.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    setIsSubmitting(true);
    try {
      const res = await apiClient<RegistrationApiResponse>('/registrations', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: Number(selectedPatientId),
          polyclinic_id: Number(selectedPoliId),
          doctor_id: Number(selectedDoctorId),
          schedule_id: Number(selectedScheduleId),
          insurance_type: insuranceType,
          registration_date: todayStr,
        }),
      });

      const poli = polyclinics.find((p) => p.id === Number(selectedPoliId));
      const doc = doctors.find((d) => d.id === Number(selectedDoctorId));

      setCreatedTicket({
        id: res.data.id,
        queue_number: res.data.queue_number,
        queue_sequence: res.data.queue_sequence,
        patient_name: selectedPatient?.name || 'Pasien',
        medical_record_number: selectedPatient?.medical_record_number || '-',
        nik: selectedPatient?.nik,
        polyclinic_name: poli?.name || 'Poliklinik Rawat Jalan',
        doctor_name: doc?.name || 'Dokter DPJP',
        insurance_type: insuranceType,
        registration_date: res.data.registration_date,
        status: res.data.status,
      });

      // Reset selection
      setSelectedPatientId('');
      setSelectedScheduleId('');
      setPatientSearch('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal memproses pendaftaran kunjungan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="registration-form-heading" style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <h2
          id="registration-form-heading"
          style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            color: 'var(--color-text-main)',
            letterSpacing: '-0.01em',
          }}
        >
          Formulir Pendaftaran Rawat Jalan
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          Pendaftaran kunjungan pasien umum dan BPJS Kesehatan dengan generator nomor antrean harian otomatis.
        </p>
      </div>

      {loadError && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="danger" title="Gagal Memuat Master Data">
            {loadError}
          </Alert>
        </div>
      )}

      {submitError && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="danger" title="Gagal Menyimpan Pendaftaran">
            {submitError}
          </Alert>
        </div>
      )}

      <Card elevation="med" padding={6} style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Section 1: Pemilihan Pasien */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 'var(--space-3)' }}>
              1. Identitas Pasien
            </h3>

            <div style={{ marginBottom: 'var(--space-3)' }}>
              <Input
                id="search_patient_term"
                label="Cari Pasien (No. RM, NIK, atau Nama)"
                placeholder="Ketik untuk memfilter daftar pasien..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="patient_selector"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-main)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Pilih Pasien Terdaftar *
              </label>
              <select
                id="patient_selector"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-main)',
                  fontSize: '0.875rem',
                }}
                disabled={isLoadingMaster}
                required
              >
                <option value="">-- Pilih Pasien Dari Direktori ({filteredPatients.length} ditemukan) --</option>
                {filteredPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.medical_record_number}] {p.name} - NIK: {p.nik}
                  </option>
                ))}
              </select>
            </div>

            {selectedPatient && (
              <div
                style={{
                  marginTop: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--color-primary-light)',
                  border: '1px solid var(--color-primary-border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                }}
              >
                <div>
                  <strong>{selectedPatient.name}</strong> • RM: <span style={{ fontFamily: 'monospace' }}>{selectedPatient.medical_record_number}</span>
                </div>
                <div>
                  NIK: <span style={{ fontFamily: 'monospace' }}>{selectedPatient.nik}</span>
                  {selectedPatient.bpjs_number && (
                    <span style={{ marginLeft: 'var(--space-3)' }}>
                      BPJS: <span style={{ fontFamily: 'monospace' }}>{selectedPatient.bpjs_number}</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Pemilihan Poliklinik & Dokter */}
          <div style={{ paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 'var(--space-3)' }}>
              2. Tujuan Poliklinik & Dokter DPJP
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              <div>
                <label
                  htmlFor="polyclinic_selector"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-text-main)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Poliklinik Tujuan *
                </label>
                <select
                  id="polyclinic_selector"
                  value={selectedPoliId}
                  onChange={(e) => {
                    setSelectedPoliId(e.target.value);
                    setSelectedScheduleId('');
                  }}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-main)',
                    fontSize: '0.875rem',
                  }}
                  required
                >
                  <option value="">-- Pilih Poliklinik --</option>
                  {polyclinics.map((poli) => (
                    <option key={poli.id} value={poli.id}>
                      {poli.name} ({poli.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="doctor_selector"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--color-text-main)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Dokter Spesialis DPJP *
                </label>
                <select
                  id="doctor_selector"
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    setSelectedScheduleId('');
                  }}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-main)',
                    fontSize: '0.875rem',
                  }}
                  required
                >
                  <option value="">-- Pilih Dokter DPJP --</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.specialization})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-4)' }}>
              <label
                htmlFor="schedule_selector"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-main)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Jadwal Praktik Dokter Tersedia *
              </label>
              <select
                id="schedule_selector"
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-main)',
                  fontSize: '0.875rem',
                }}
                required
              >
                <option value="">
                  {availableSchedules.length === 0
                    ? '-- Tidak ada jadwal sesuai pilihan Poli / Dokter --'
                    : '-- Pilih Jadwal Praktik Hari Ini --'}
                </option>
                {availableSchedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    Hari {s.day_of_week} ({s.start_time} - {s.end_time} WIB) • Kuota: {s.quota} pasien
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Jenis Penjamin (Umum vs BPJS) */}
          <div style={{ paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 'var(--space-2)' }}>
              3. Pilih Jenis Penjamin
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
              Pasien BPJS berhak atas pembebasan biaya pendaftaran dan layanan rawat jalan terpadu.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${insuranceType === 'GENERAL' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  backgroundColor: insuranceType === 'GENERAL' ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                <input
                  type="radio"
                  name="insurance_type"
                  value="GENERAL"
                  checked={insuranceType === 'GENERAL'}
                  onChange={() => setInsuranceType('GENERAL')}
                />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-text-main)', fontSize: '0.875rem' }}>
                    Umum / Mandiri (Cash)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Biaya registrasi: Rp 25.000 (Draf Tagihan Kasir)
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${insuranceType === 'BPJS' ? 'var(--color-success-border)' : 'var(--color-border)'}`,
                  backgroundColor: insuranceType === 'BPJS' ? 'var(--color-success-bg)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                <input
                  type="radio"
                  name="insurance_type"
                  value="BPJS"
                  checked={insuranceType === 'BPJS'}
                  onChange={() => setInsuranceType('BPJS')}
                />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-text-main)', fontSize: '0.875rem' }}>
                    BPJS Kesehatan
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Dicover 100% BPJS (Bebas Biaya Pendaftaran)
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Tombol Submit */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-3)',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--color-border-subtle)',
            }}
          >
            <Button
              type="submit"
              variant="primary"
              size="lg"
              label="Daftarkan & Terbitkan Karcis Antrean"
              isLoading={isSubmitting}
            >
              Daftarkan & Terbitkan Karcis Antrean
            </Button>
          </div>
        </form>
      </Card>

      {/* Modal Karcis Antrean */}
      {createdTicket && (
        <QueueTicketModal
          ticket={createdTicket}
          onClose={() => setCreatedTicket(null)}
        />
      )}
    </section>
  );
};
