import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Button } from '@astryxdesign/core/Button';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Selector } from '@astryxdesign/core/Selector';
import { Banner } from '@astryxdesign/core/Banner';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
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
    <section aria-labelledby="registration-form-heading" className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2
          id="registration-form-heading"
          className="text-2xl font-bold text-slate-900 tracking-tight"
        >
          Formulir Pendaftaran Rawat Jalan
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Pendaftaran kunjungan pasien umum dan BPJS Kesehatan dengan generator nomor antrean harian otomatis.
        </p>
      </div>

      {loadError && (
        <div className="mb-4">
          <Banner status="error" title="Gagal Memuat Master Data" description={loadError} container="card" />
        </div>
      )}

      {submitError && (
        <div className="mb-4">
          <Banner status="error" title="Gagal Menyimpan Pendaftaran" description={submitError} container="card" />
        </div>
      )}

      <Card elevation="low" padding={6}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Pemilihan Pasien */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3">
              1. Identitas Pasien
            </h3>

            <VStack gap={3}>
              <TextInput
                label="Cari Pasien (No. RM, NIK, atau Nama)"
                placeholder="Ketik untuk memfilter daftar pasien..."
                value={patientSearch}
                onChange={(val) => setPatientSearch(val)}
                width="100%"
              />

              <Selector
                label="Pilih Pasien Terdaftar *"
                value={selectedPatientId}
                onChange={(val) => setSelectedPatientId(val)}
                options={[
                  { value: '', label: `-- Pilih Pasien Dari Direktori (${filteredPatients.length} ditemukan) --` },
                  ...filteredPatients.map((p) => ({
                    value: String(p.id),
                    label: `[${p.medical_record_number}] ${p.name} - NIK: ${p.nik}`,
                  })),
                ]}
                isDisabled={isLoadingMaster}
                width="100%"
              />

              {selectedPatient && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs flex justify-between flex-wrap gap-2 text-teal-950">
                  <div>
                    <strong>{selectedPatient.name}</strong> • RM:{' '}
                    <span className="font-mono font-bold text-teal-800">
                      {selectedPatient.medical_record_number}
                    </span>
                  </div>
                  <div>
                    NIK: <span className="font-mono">{selectedPatient.nik}</span>
                    {selectedPatient.bpjs_number && (
                      <span className="ml-3">
                        BPJS: <span className="font-mono">{selectedPatient.bpjs_number}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </VStack>
          </div>

          {/* Section 2: Pemilihan Poliklinik & Dokter */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">
              2. Tujuan Poliklinik & Dokter DPJP
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Selector
                label="Poliklinik Tujuan *"
                value={selectedPoliId}
                onChange={(val) => {
                  setSelectedPoliId(val);
                  setSelectedScheduleId('');
                }}
                options={[
                  { value: '', label: '-- Pilih Poliklinik --' },
                  ...polyclinics.map((poli) => ({
                    value: String(poli.id),
                    label: `${poli.name} (${poli.code})`,
                  })),
                ]}
                width="100%"
              />

              <Selector
                label="Dokter Spesialis DPJP *"
                value={selectedDoctorId}
                onChange={(val) => {
                  setSelectedDoctorId(val);
                  setSelectedScheduleId('');
                }}
                options={[
                  { value: '', label: '-- Pilih Dokter DPJP --' },
                  ...doctors.map((doc) => ({
                    value: String(doc.id),
                    label: `${doc.name} (${doc.specialization})`,
                  })),
                ]}
                width="100%"
              />
            </div>

            <div className="mt-4">
              <Selector
                label="Jadwal Praktik Dokter Tersedia *"
                value={selectedScheduleId}
                onChange={(val) => setSelectedScheduleId(val)}
                options={[
                  {
                    value: '',
                    label:
                      availableSchedules.length === 0
                        ? '-- Tidak ada jadwal sesuai pilihan Poli / Dokter --'
                        : '-- Pilih Jadwal Praktik Hari Ini --',
                  },
                  ...availableSchedules.map((s) => ({
                    value: String(s.id),
                    label: `Hari ${s.day_of_week} (${s.start_time} - ${s.end_time} WIB) • Kuota: ${s.quota} pasien`,
                  })),
                ]}
                width="100%"
              />
            </div>
          </div>

          {/* Section 3: Jenis Penjamin (Umum vs BPJS) */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              3. Pilih Jenis Penjamin
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Pasien BPJS berhak atas pembebasan biaya pendaftaran dan layanan rawat jalan terpadu.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                  insuranceType === 'GENERAL'
                    ? 'border-teal-500 bg-teal-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="insurance_type"
                  value="GENERAL"
                  checked={insuranceType === 'GENERAL'}
                  onChange={() => setInsuranceType('GENERAL')}
                  className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    Umum / Mandiri (Cash)
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Biaya registrasi: Rp 25.000 (Draf Tagihan Kasir)
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition-all ${
                  insuranceType === 'BPJS'
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="insurance_type"
                  value="BPJS"
                  checked={insuranceType === 'BPJS'}
                  onChange={() => setInsuranceType('BPJS')}
                  className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    BPJS Kesehatan
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Dicover 100% BPJS (Bebas Biaya Pendaftaran)
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Tombol Submit */}
          <HStack justify="end" gap={3} className="pt-4 border-t border-slate-200">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              label="Daftarkan & Terbitkan Karcis Antrean"
              isLoading={isSubmitting}
            />
          </HStack>
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
