import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Section } from '@astryxdesign/core/Section';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { Banner } from '@astryxdesign/core/Banner';
import { InfoTip } from '@astryxdesign/core/InfoTip';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Breadcrumbs, BreadcrumbItem } from '@astryxdesign/core/Breadcrumbs';
import { Typeahead, TypeaheadItem, createStaticSource, type SearchableItem } from '@astryxdesign/core/Typeahead';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { SelectableCard } from '@astryxdesign/core/SelectableCard';
import { Selector } from '@astryxdesign/core/Selector';
import { FormLayout } from '@astryxdesign/core/FormLayout';
import { apiClient } from '@/lib/api-client';
import { QueueTicketModal, type QueueTicketData } from './QueueTicketModal';

export interface PatientOption {
  id: number;
  name: string;
  medical_record_number: string;
  nik: string;
  bpjs_number?: string;
  birth_date?: string;
  gender?: 'L' | 'P' | string;
  address?: string;
  phone?: string;
}

export interface PolyclinicOption {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
}

export interface DoctorOption {
  id: number;
  name: string;
  specialization: string;
}

export interface DoctorScheduleOption {
  id: number;
  doctor_id: number;
  polyclinic_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  quota: number;
}

export interface RegistrationApiResponse {
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

export interface PatientSearchItem extends SearchableItem<PatientOption> {
  id: string;
  label: string;
  auxiliaryData: PatientOption;
}

export const RegistrationForm: React.FC = () => {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [polyclinics, setPolyclinics] = useState<PolyclinicOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [schedules, setSchedules] = useState<DoctorScheduleOption[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form selections
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchItem | null>(null);
  const [selectedPoliId, setSelectedPoliId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [insuranceType, setInsuranceType] = useState<'GENERAL' | 'BPJS'>('GENERAL');

  // Submit & Ticket State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<QueueTicketData | null>(null);

  // Parallel data fetching: zero waterfall
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

  // Helper mask NIK
  const maskNik = (nik?: string): string => {
    if (!nik || nik.length < 8) return nik || '-';
    return `${nik.slice(0, 6)}******${nik.slice(-4)}`;
  };

  // Static Search Source for Typeahead
  const patientSearchItems = useMemo<PatientSearchItem[]>(() => {
    return patients.map((p) => ({
      id: String(p.id),
      label: `${p.name} (${p.medical_record_number})`,
      auxiliaryData: p,
    }));
  }, [patients]);

  const patientSource = useMemo(() => {
    return createStaticSource<PatientSearchItem>(patientSearchItems, {
      keywords: (item) => [
        item.auxiliaryData.medical_record_number,
        item.auxiliaryData.nik,
        item.auxiliaryData.name,
        item.auxiliaryData.bpjs_number || '',
      ],
    });
  }, [patientSearchItems]);

  // Available schedules based on poli and doctor selection
  const availableSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (selectedPoliId && s.polyclinic_id !== Number(selectedPoliId)) return false;
      if (selectedDoctorId && s.doctor_id !== Number(selectedDoctorId)) return false;
      return true;
    });
  }, [schedules, selectedPoliId, selectedDoctorId]);

  // Available doctors filtered by selected polyclinic if schedule exists, or all doctors
  const availableDoctors = useMemo(() => {
    if (!selectedPoliId) return [];
    const doctorIdsInPoli = new Set(
      schedules
        .filter((s) => s.polyclinic_id === Number(selectedPoliId))
        .map((s) => s.doctor_id)
    );
    if (doctorIdsInPoli.size > 0) {
      const filtered = doctors.filter((d) => doctorIdsInPoli.has(d.id));
      if (filtered.length > 0) return filtered;
    }
    return doctors;
  }, [doctors, schedules, selectedPoliId]);

  // SMART DEFAULT 1: Auto-select schedule jika hanya ada 1 jadwal praktik yang tersedia
  useEffect(() => {
    if (selectedDoctorId && availableSchedules.length === 1) {
      const singleSchedule = availableSchedules[0];
      if (singleSchedule.quota > 0 && selectedScheduleId !== String(singleSchedule.id)) {
        setSelectedScheduleId(String(singleSchedule.id));
      }
    }
  }, [selectedDoctorId, availableSchedules, selectedScheduleId]);

  // SMART DEFAULT 2: Jika pasien memiliki nomor BPJS, otomatis berikan default BPJS
  const handleSelectPatient = (item: PatientSearchItem | null) => {
    setSelectedPatient(item);
    if (item?.auxiliaryData.bpjs_number) {
      setInsuranceType('BPJS');
    } else if (item) {
      setInsuranceType('GENERAL');
    }
  };

  // Entity lookups for summary
  const selectedPoli = useMemo(
    () => polyclinics.find((p) => String(p.id) === selectedPoliId),
    [polyclinics, selectedPoliId]
  );
  const selectedDoctor = useMemo(
    () => doctors.find((d) => String(d.id) === selectedDoctorId),
    [doctors, selectedDoctorId]
  );
  const selectedSchedule = useMemo(
    () => schedules.find((s) => String(s.id) === selectedScheduleId),
    [schedules, selectedScheduleId]
  );

  // Checklist Kesiapan (Pencegahan Error Sebelum Terjadi)
  const isPatientReady = Boolean(selectedPatient);
  const isPoliReady = Boolean(selectedPoliId);
  const isDoctorReady = Boolean(selectedDoctorId);
  const isScheduleReady = Boolean(selectedScheduleId);
  const isFormComplete = isPatientReady && isPoliReady && isDoctorReady && isScheduleReady;

  const isSubmitDisabled = !isFormComplete || isSubmitting;

  const handleReset = () => {
    setSelectedPatient(null);
    setSelectedPoliId('');
    setSelectedDoctorId('');
    setSelectedScheduleId('');
    setInsuranceType('GENERAL');
    setSubmitError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitError(null);

    if (!selectedPatient) {
      setSubmitError('Silakan pilih pasien yang akan didaftarkan terlebih dahulu.');
      return;
    }
    if (!selectedPoliId) {
      setSubmitError('Silakan pilih poliklinik tujuan pelayanan.');
      return;
    }
    if (!selectedDoctorId) {
      setSubmitError('Silakan pilih Dokter Penanggung Jawab (DPJP).');
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
          patient_id: Number(selectedPatient.id),
          polyclinic_id: Number(selectedPoliId),
          doctor_id: Number(selectedDoctorId),
          schedule_id: Number(selectedScheduleId),
          insurance_type: insuranceType,
          registration_date: todayStr,
        }),
      });

      setCreatedTicket({
        id: res.data.id,
        queue_number: res.data.queue_number,
        queue_sequence: res.data.queue_sequence,
        patient_name: selectedPatient.auxiliaryData.name || 'Pasien',
        medical_record_number: selectedPatient.auxiliaryData.medical_record_number || '-',
        nik: selectedPatient.auxiliaryData.nik,
        polyclinic_name: selectedPoli?.name || 'Poliklinik Rawat Jalan',
        doctor_name: selectedDoctor?.name || 'Dokter DPJP',
        insurance_type: insuranceType,
        registration_date: res.data.registration_date,
        status: res.data.status,
      });

      // Reset selection setelah berhasil
      setSelectedPatient(null);
      setSelectedScheduleId('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal memproses pendaftaran kunjungan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  return (
    <Section
      variant="transparent"
      style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 0 var(--space-8) 0',
      }}
    >
      {/* 1. Breadcrumbs Trail */}
      <VStack gap={3} style={{ marginBottom: 'var(--space-5)' }}>
        <Breadcrumbs>
          <BreadcrumbItem>Layanan Pasien</BreadcrumbItem>
          <BreadcrumbItem>Pendaftaran Kunjungan</BreadcrumbItem>
          <BreadcrumbItem isCurrent>Rawat Jalan</BreadcrumbItem>
        </Breadcrumbs>

        {/* 2. Page Header & Live Badges */}
        <HStack justify="between" align="center" wrap="wrap" gap={3}>
          <VStack gap={1}>
            <Heading level={2}>Formulir Pendaftaran Rawat Jalan</Heading>
            <Text type="body" style={{ color: 'var(--color-text-secondary)' }}>
              Pendaftaran kunjungan pasien umum dan BPJS Kesehatan dengan generator nomor antrean harian otomatis.
            </Text>
          </VStack>

          <HStack gap={2} align="center">
            <Badge variant="teal" label={todayFormatted} />
            <Badge variant="neutral" label="Unit: Loket Utama" />
          </HStack>
        </HStack>
      </VStack>

      {/* Global Alerts */}
      {loadError && (
        <VStack gap={2} style={{ marginBottom: 'var(--space-4)' }}>
          <Banner
            status="error"
            title="Gagal Memuat Master Data"
            description={loadError}
          />
        </VStack>
      )}

      {submitError && (
        <VStack gap={2} style={{ marginBottom: 'var(--space-4)' }}>
          <Banner
            status="error"
            title="Gagal Menyimpan Pendaftaran"
            description={submitError}
          />
        </VStack>
      )}

      {/* Two-Column Responsive Layout: 2/3 Form Steps & 1/3 Sticky Summary */}
      <Grid columns={{ minWidth: 320, max: 3 }} gap={5}>
        {/* =========================================================================
            LEFT COLUMN: 3 Steps Form (Occupies 2 spans on desktop)
            ========================================================================= */}
        <VStack gap={5} style={{ gridColumn: 'span 2' }}>
          {/* STEP 1: IDENTITAS PASIEN */}
          <Card elevation="low" padding={6}>
            <VStack gap={4}>
              <HStack justify="between" align="center">
                <HStack gap={2} align="center">
                  <Badge variant={isPatientReady ? 'success' : 'teal'} label={isPatientReady ? '✓ Langkah 1 Selesai' : 'Langkah 1'} />
                  <Heading level={3}>Identitas Pasien</Heading>
                </HStack>

                {selectedPatient && (
                  <Button
                    variant="secondary"
                    size="sm"
                    label="Ganti Pasien"
                    onClick={() => handleSelectPatient(null)}
                  />
                )}
              </HStack>

              <Divider orientation="horizontal" />

              {isLoadingMaster ? (
                <VStack gap={3}>
                  <Skeleton height="40px" width="100%" />
                  <Skeleton height="80px" width="100%" />
                </VStack>
              ) : selectedPatient ? (
                /* Selected Patient Summary Card using MetadataList */
                <Card
                  variant="muted"
                  padding={4}
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    borderColor: 'var(--color-primary-border)',
                  }}
                >
                  <VStack gap={3}>
                    <HStack justify="between" align="center" wrap="wrap" gap={2}>
                      <HStack gap={2} align="center">
                        <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>👤</span>
                        <Heading level={4}>{selectedPatient.auxiliaryData.name}</Heading>
                        <Badge
                          variant={selectedPatient.auxiliaryData.bpjs_number ? 'success' : 'teal'}
                          label={
                            selectedPatient.auxiliaryData.bpjs_number
                              ? '🛡️ BPJS Terdaftar'
                              : '💵 Pasien Umum / Mandiri'
                          }
                        />
                      </HStack>
                      <Text
                        type="code"
                        style={{
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                          fontSize: '0.9375rem',
                        }}
                      >
                        RM: {selectedPatient.auxiliaryData.medical_record_number}
                      </Text>
                    </HStack>

                    <Divider orientation="horizontal" />

                    <MetadataList columns="multi">
                      <MetadataListItem label="No. Rekam Medis">
                        <Text type="code" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                          {selectedPatient.auxiliaryData.medical_record_number}
                        </Text>
                      </MetadataListItem>
                      <MetadataListItem label="NIK Kependudukan">
                        <Text type="code">
                          {maskNik(selectedPatient.auxiliaryData.nik)}
                        </Text>
                      </MetadataListItem>
                      <MetadataListItem label="Jenis Kelamin">
                        <Text type="body">
                          {selectedPatient.auxiliaryData.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </Text>
                      </MetadataListItem>
                      <MetadataListItem label="Tanggal Lahir">
                        <Text type="body">
                          {selectedPatient.auxiliaryData.birth_date || '-'}
                        </Text>
                      </MetadataListItem>
                      <MetadataListItem label="No. BPJS Kesehatan">
                        <Text type="code">
                          {selectedPatient.auxiliaryData.bpjs_number || 'Tidak Terdaftar'}
                        </Text>
                      </MetadataListItem>
                      <MetadataListItem label="Alamat Domisili">
                        <Text type="body">
                          {selectedPatient.auxiliaryData.address || '-'}
                        </Text>
                      </MetadataListItem>
                    </MetadataList>

                    {selectedPatient.auxiliaryData.bpjs_number && (
                      <div
                        style={{
                          backgroundColor: 'var(--color-success-bg)',
                          border: '1px solid var(--color-success-border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          color: 'var(--color-success-text)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span aria-hidden="true">💡</span>
                        <span>Nomor kartu BPJS terdeteksi. Jenis penjamin telah disesuaikan ke <strong>BPJS Kesehatan (Bebas Biaya)</strong>.</span>
                      </div>
                    )}
                  </VStack>
                </Card>
              ) : (
                /* Typeahead Pasien Pintar */
                <VStack gap={2}>
                  <Typeahead<PatientSearchItem>
                    label="Cari Pasien (No. RM, NIK, atau Nama)"
                    placeholder="Ketik nama pasien, nomor RM, atau NIK kependudukan..."
                    searchSource={patientSource}
                    value={selectedPatient}
                    onChange={(item) => handleSelectPatient(item)}
                    isRequired
                    width="100%"
                    description="Pencarian terpadu data rekam medis pasien secara langsung."
                    renderItem={(item) => (
                      <TypeaheadItem
                        item={item}
                        description={`No. RM: ${item.auxiliaryData.medical_record_number} • NIK: ${maskNik(item.auxiliaryData.nik)} • ${item.auxiliaryData.gender === 'L' ? 'Laki-laki' : 'Perempuan'}`}
                      />
                    )}
                    emptySearchText={
                      <VStack gap={2} align="center" style={{ padding: 'var(--space-3) 0' }}>
                        <Text type="supporting" style={{ color: 'var(--color-text-muted)' }}>
                          Pasien tidak ditemukan dalam basis data rekam medis.
                        </Text>
                        <Button
                          variant="secondary"
                          size="sm"
                          label="Daftarkan Pasien Baru"
                          onClick={() => {
                            window.location.hash = '#/master/patients';
                          }}
                        />
                      </VStack>
                    }
                  />
                  <Text type="supporting" style={{ color: 'var(--color-text-muted)' }}>
                    Total pasien terindeks: {patients.length} rekam medis aktif.
                  </Text>
                </VStack>
              )}
            </VStack>
          </Card>

          {/* STEP 2: POLIKLINIK & DOKTER DPJP */}
          <Card elevation="low" padding={6}>
            <VStack gap={4}>
              <HStack gap={2} align="center">
                <Badge
                  variant={isPoliReady && isDoctorReady && isScheduleReady ? 'success' : 'teal'}
                  label={isPoliReady && isDoctorReady && isScheduleReady ? '✓ Langkah 2 Selesai' : 'Langkah 2'}
                />
                <Heading level={3}>Tujuan Poliklinik & Dokter DPJP</Heading>
              </HStack>

              <Divider orientation="horizontal" />

              <FormLayout direction="vertical">
                {/* Grid 2 Kolom untuk Poliklinik dan Dokter */}
                <Grid columns={{ minWidth: 260, max: 2 }} gap={4}>
                  <Selector
                    label="Poliklinik Tujuan"
                    value={selectedPoliId}
                    onChange={(val) => {
                      setSelectedPoliId(val);
                      setSelectedDoctorId('');
                      setSelectedScheduleId('');
                    }}
                    isRequired
                    options={[
                      { value: '', label: '-- Pilih Poliklinik --' },
                      ...polyclinics.map((poli) => ({
                        value: String(poli.id),
                        label: `${poli.name} (${poli.code})`,
                      })),
                    ]}
                    width="100%"
                  />

                  <VStack gap={1}>
                    <HStack justify="between" align="center">
                      <Text type="label" style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                        Dokter Penanggung Jawab (DPJP) *
                      </Text>
                      <InfoTip content="Dokter Penanggung Jawab Pelayanan (DPJP) yang memimpin dan bertanggung jawab penuh atas rangkaian asuhan medis pasien." />
                    </HStack>
                    <Selector
                      label="Dokter Penanggung Jawab (DPJP)"
                      isLabelHidden
                      value={selectedDoctorId}
                      onChange={(val) => {
                        setSelectedDoctorId(val);
                        setSelectedScheduleId('');
                      }}
                      isRequired
                      isDisabled={!selectedPoliId}
                      description={
                        !selectedPoliId
                          ? 'Pilih poliklinik terlebih dahulu'
                          : 'Pilih dokter spesialis penanggung jawab'
                      }
                      options={[
                        {
                          value: '',
                          label: !selectedPoliId
                            ? '-- Pilih Poliklinik Terlebih Dahulu --'
                            : '-- Pilih Dokter DPJP --',
                        },
                        ...availableDoctors.map((doc) => ({
                          value: String(doc.id),
                          label: `${doc.name} (${doc.specialization})`,
                        })),
                      ]}
                      width="100%"
                    />
                  </VStack>
                </Grid>

                {/* Jadwal Praktik Dokter */}
                <VStack gap={2} style={{ marginTop: 'var(--space-3)' }}>
                  <Selector
                    label="Jadwal Praktik Dokter Hari Ini"
                    value={selectedScheduleId}
                    onChange={(val) => setSelectedScheduleId(val)}
                    isRequired
                    isDisabled={!selectedDoctorId}
                    description={
                      !selectedDoctorId
                        ? 'Pilih dokter terlebih dahulu untuk melihat jadwal'
                        : availableSchedules.length === 1
                        ? 'Jadwal otomatis dipilih (hanya 1 sesi praktik hari ini)'
                        : 'Pilih sesi praktik aktif dokter'
                    }
                    options={[
                      {
                        value: '',
                        label: !selectedDoctorId
                          ? '-- Pilih Dokter Terlebih Dahulu --'
                          : availableSchedules.length === 0
                          ? '-- Tidak Ada Jadwal Praktik Hari Ini --'
                          : '-- Pilih Jadwal Praktik Hari Ini --',
                      },
                      ...availableSchedules.map((s) => ({
                        value: String(s.id),
                        label: `Hari ${s.day_of_week} (${s.start_time} - ${s.end_time} WIB) • ${
                          s.quota <= 0 ? '[Kuota Habis]' : `Sisa Kuota: ${s.quota} pasien`
                        }`,
                        disabled: s.quota <= 0,
                      })),
                    ]}
                    width="100%"
                  />

                  {selectedDoctorId && availableSchedules.length === 0 && (
                    <Banner
                      status="info"
                      title="Tidak Ada Jadwal Praktik Hari Ini"
                      description="Dokter spesialis yang dipilih belum memiliki sesi praktik pada poliklinik ini untuk hari ini. Silakan pilih dokter lain."
                    />
                  )}
                </VStack>
              </FormLayout>
            </VStack>
          </Card>

          {/* STEP 3: JENIS PENJAMIN */}
          <Card elevation="low" padding={6}>
            <VStack gap={4}>
              <HStack gap={2} align="center">
                <Badge variant="teal" label="Langkah 3" />
                <Heading level={3}>Pilih Jenis Penjamin</Heading>
              </HStack>
              <Text type="body" style={{ color: 'var(--color-text-secondary)' }}>
                Tentukan skema pembiayaan kunjungan pasien untuk penerbitan tagihan kasir atau klaim BPJS.
              </Text>

              <Divider orientation="horizontal" />

              <Grid columns={{ minWidth: 260, max: 2 }} gap={4}>
                {/* Kartu 1: Umum / Mandiri */}
                <SelectableCard
                  label="Pilih Penjamin Umum / Mandiri (Cash)"
                  isSelected={insuranceType === 'GENERAL'}
                  onChange={() => setInsuranceType('GENERAL')}
                  padding={5}
                >
                  <VStack gap={2}>
                    <HStack justify="between" align="center">
                      <HStack gap={2} align="center">
                        <span aria-hidden="true">💵</span>
                        <Heading level={4}>Umum / Mandiri (Cash)</Heading>
                      </HStack>
                      <Badge
                        variant={insuranceType === 'GENERAL' ? 'teal' : 'neutral'}
                        label={insuranceType === 'GENERAL' ? '✓ Terpilih: Rp 25.000' : 'Rp 25.000'}
                      />
                    </HStack>
                    <Text type="body" style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                      Biaya registrasi: Rp 25.000
                    </Text>
                    <Text type="supporting" style={{ color: 'var(--color-text-muted)' }}>
                      Draf tagihan administrasi rawat jalan otomatis diteruskan ke loket Kasir & Pembayaran.
                    </Text>
                  </VStack>
                </SelectableCard>

                {/* Kartu 2: BPJS Kesehatan */}
                <SelectableCard
                  label="Pilih Penjamin BPJS Kesehatan"
                  isSelected={insuranceType === 'BPJS'}
                  onChange={() => setInsuranceType('BPJS')}
                  padding={5}
                >
                  <VStack gap={2}>
                    <HStack justify="between" align="center">
                      <HStack gap={2} align="center">
                        <span aria-hidden="true">🛡️</span>
                        <Heading level={4}>BPJS Kesehatan</Heading>
                      </HStack>
                      <Badge
                        variant={insuranceType === 'BPJS' ? 'success' : 'neutral'}
                        label={insuranceType === 'BPJS' ? '✓ Terpilih: Bebas Biaya' : 'Bebas Biaya'}
                      />
                    </HStack>
                    <Text type="body" style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                      Dicover 100% BPJS (Bebas Biaya Pendaftaran)
                    </Text>
                    <Text type="supporting" style={{ color: 'var(--color-text-muted)' }}>
                      Verifikasi nomor rujukan faskes dan penerbitan Surat Eligibilitas Peserta (SEP) terpadu.
                    </Text>
                  </VStack>
                </SelectableCard>
              </Grid>
            </VStack>
          </Card>
        </VStack>

        {/* =========================================================================
            RIGHT COLUMN: STICKY SUMMARY PANEL (Occupies 1 span on desktop)
            ========================================================================= */}
        <VStack gap={4} style={{ gridColumn: 'span 1' }}>
          <Card
            elevation="low"
            padding={5}
            style={{
              position: 'sticky',
              top: '80px',
              borderTop: '4px solid var(--color-primary)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <VStack gap={4}>
              <HStack justify="between" align="center">
                <Heading level={4}>Ringkasan Kunjungan</Heading>
                <Badge variant="teal" label="Loket Pendaftaran" />
              </HStack>

              <Divider orientation="horizontal" />

              {/* Data Pasien */}
              <VStack gap={1}>
                <Text
                  type="label"
                  style={{
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  Identitas Pasien:
                </Text>
                {selectedPatient ? (
                  <VStack gap={0}>
                    <Text type="body" style={{ fontWeight: 800, color: 'var(--color-text-main)' }}>
                      {selectedPatient.auxiliaryData.name}
                    </Text>
                    <Text
                      type="code"
                      style={{ color: 'var(--color-primary)', fontSize: '0.8125rem', fontWeight: 700 }}
                    >
                      RM: {selectedPatient.auxiliaryData.medical_record_number}
                    </Text>
                  </VStack>
                ) : (
                  <Text type="body" style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.8125rem' }}>
                    Belum memilih pasien
                  </Text>
                )}
              </VStack>

              <Divider orientation="horizontal" />

              {/* Data Layanan & Dokter */}
              <VStack gap={2}>
                <VStack gap={0}>
                  <Text
                    type="label"
                    style={{
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    Poliklinik Tujuan:
                  </Text>
                  <Text type="body" style={{ fontWeight: 600 }}>
                    {selectedPoli ? selectedPoli.name : 'Belum dipilih'}
                  </Text>
                </VStack>

                <VStack gap={0}>
                  <Text
                    type="label"
                    style={{
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    Dokter DPJP:
                  </Text>
                  <Text type="body" style={{ fontWeight: 600 }}>
                    {selectedDoctor ? selectedDoctor.name : 'Belum dipilih'}
                  </Text>
                </VStack>

                <VStack gap={0}>
                  <Text
                    type="label"
                    style={{
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    Jadwal Praktik:
                  </Text>
                  <Text type="supporting" style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedSchedule
                      ? `Hari ${selectedSchedule.day_of_week} (${selectedSchedule.start_time} - ${selectedSchedule.end_time} WIB)`
                      : 'Belum dipilih'}
                  </Text>
                </VStack>
              </VStack>

              <Divider orientation="horizontal" />

              {/* Biaya & Penjamin */}
              <VStack gap={2}>
                <HStack justify="between" align="center">
                  <Text type="body" style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                    Jenis Penjamin:
                  </Text>
                  <Badge
                    variant={insuranceType === 'BPJS' ? 'success' : 'teal'}
                    label={insuranceType === 'BPJS' ? 'BPJS Kesehatan' : 'Umum / Mandiri'}
                  />
                </HStack>

                <HStack justify="between" align="center">
                  <Text type="body" style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
                    Biaya Registrasi:
                  </Text>
                  <Heading
                    level={4}
                    style={{
                      color:
                        insuranceType === 'BPJS'
                          ? 'var(--color-success-text)'
                          : 'var(--color-primary)',
                      fontWeight: 800,
                    }}
                  >
                    {insuranceType === 'BPJS' ? 'Rp 0' : 'Rp 25.000'}
                  </Heading>
                </HStack>
              </VStack>

              <Divider orientation="horizontal" />

              {/* Checklist Kesiapan (Pencegahan Error Sebelum Terjadi) */}
              <div
                style={{
                  backgroundColor: isFormComplete ? 'var(--color-success-bg)' : 'var(--color-surface-subtle)',
                  border: `1px solid ${isFormComplete ? 'var(--color-success-border)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3)',
                  fontSize: '0.75rem',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '6px', color: isFormComplete ? 'var(--color-success-text)' : 'var(--color-text-secondary)' }}>
                  {isFormComplete ? '✓ Data Pendaftaran Siap' : 'Kelengkapan Formulir:'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', color: 'var(--color-text-muted)' }}>
                  <div style={{ color: isPatientReady ? 'var(--color-success-text)' : 'inherit' }}>
                    {isPatientReady ? '✓' : '○'} Pasien Terpilih
                  </div>
                  <div style={{ color: isPoliReady ? 'var(--color-success-text)' : 'inherit' }}>
                    {isPoliReady ? '✓' : '○'} Poliklinik Terpilih
                  </div>
                  <div style={{ color: isDoctorReady ? 'var(--color-success-text)' : 'inherit' }}>
                    {isDoctorReady ? '✓' : '○'} Dokter DPJP Terpilih
                  </div>
                  <div style={{ color: isScheduleReady ? 'var(--color-success-text)' : 'inherit' }}>
                    {isScheduleReady ? '✓' : '○'} Jadwal Praktik Terpilih
                  </div>
                </div>
              </div>

              {/* Aksi Pendaftaran */}
              <VStack gap={2}>
                <Button
                  variant="primary"
                  size="lg"
                  label={isSubmitting ? 'Memproses Pendaftaran...' : 'Daftarkan & Terbitkan Karcis Antrean'}
                  isLoading={isSubmitting}
                  isDisabled={isSubmitDisabled}
                  onClick={handleSubmit}
                  width="100%"
                />

                <Button
                  variant="secondary"
                  size="md"
                  label="Reset Formulir"
                  onClick={handleReset}
                  isDisabled={isSubmitting}
                  width="100%"
                />
              </VStack>
            </VStack>
          </Card>
        </VStack>
      </Grid>

      {/* Modal Cetak Karcis Antrean Setelah Pendaftaran Sukses */}
      {createdTicket && (
        <QueueTicketModal
          ticket={createdTicket}
          onClose={() => setCreatedTicket(null)}
        />
      )}
    </Section>
  );
};
