import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout, LayoutContent, LayoutPanel } from '@astryxdesign/core/Layout';
import { VStack, HStack, StackItem } from '@astryxdesign/core/Stack';
import { Card } from '@astryxdesign/core/Card';
import { Section } from '@astryxdesign/core/Section';
import { Grid } from '@astryxdesign/core/Grid';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Code } from '@astryxdesign/core/Code';
import { Badge } from '@astryxdesign/core/Badge';
import { Token } from '@astryxdesign/core/Token';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Avatar } from '@astryxdesign/core/Avatar';
import { List, ListItem } from '@astryxdesign/core/List';
import { FormLayout } from '@astryxdesign/core/FormLayout';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Selector } from '@astryxdesign/core/Selector';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { CheckboxList, CheckboxListItem } from '@astryxdesign/core/CheckboxList';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { Banner } from '@astryxdesign/core/Banner';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { useToast } from '@astryxdesign/core/Toast';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { calculatePatientAge, isValidIcd10Code } from '@/features/nurse/utils/triage-helpers';
import { InitialAssessmentCard, type NurseAssessmentData } from './InitialAssessmentCard';

export interface DoctorQueuePatient {
  id: number;
  queue_number: string;
  insurance_type: 'GENERAL' | 'BPJS';
  registration_date: string;
  status: string;
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

export interface MedicalActionItem {
  id: number;
  code: string;
  name: string;
  category: string;
  tariff: number;
}

export interface MedicineOption {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  unit_price: number;
  is_active?: boolean;
}

interface PrescriptionDraftItem {
  key: string;
  medicineId: string;
  quantity: number | null;
  dosage: string;
  frequency: string;
  instructions: string;
}

type InsuranceFilter = 'ALL' | 'BPJS' | 'GENERAL';
type NextStatus = 'PHARMACY' | 'BILLING' | 'IN_DOCTOR';

const DEFAULT_PHYSICAL_EXAM =
  'Kepala/Leher: DBN. Thorax: Cor/Pulmo DBN. Abdomen: Supel, BU normal. Ekstremitas: Akral hangat, edema (-).';
const DEFAULT_ICD_CODE = 'I10';
const DEFAULT_ICD_DESC = 'Essential (primary) hypertension';

const COMMON_DIAGNOSIS_PRESETS = [
  { code: 'J06.9', desc: 'Infeksi saluran pernapasan akut atas, tidak spesifik (ISPA)' },
  { code: 'I10', desc: 'Essential (primary) hypertension' },
  { code: 'K30', desc: 'Functional dyspepsia' },
  { code: 'E11.9', desc: 'Type 2 diabetes mellitus without complications' },
] as const;

let draftCounter = 0;
function createEmptyPrescriptionDraft(defaultMedicineId = ''): PrescriptionDraftItem {
  draftCounter += 1;
  return {
    key: `rx-draft-${draftCounter}`,
    medicineId: defaultMedicineId,
    quantity: 1,
    dosage: '500 mg',
    frequency: '3x1 sesudah makan',
    instructions: '',
  };
}

export const DoctorExaminationForm: React.FC = () => {
  const showToast = useToast();
  const isCompactViewport = useMediaQuery('(max-width: 960px)');

  // State Antrean & Master Data
  const [queue, setQueue] = useState<DoctorQueuePatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<DoctorQueuePatient | null>(null);
  const [pendingPatientSwitch, setPendingPatientSwitch] = useState<DoctorQueuePatient | null>(null);
  const [assessment, setAssessment] = useState<NurseAssessmentData | null>(null);
  const [actionsList, setActionsList] = useState<MedicalActionItem[]>([]);
  const [medicinesList, setMedicinesList] = useState<MedicineOption[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState<boolean>(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [completedBanner, setCompletedBanner] = useState<string | null>(null);

  // Filter Panel Antrean
  const [queueSearch, setQueueSearch] = useState<string>('');
  const [insuranceFilter, setInsuranceFilter] = useState<InsuranceFilter>('ALL');
  const [isMobileQueueOpen, setIsMobileQueueOpen] = useState<boolean>(false);

  // State Formulir SOAP + Tindakan + e-Resep Atomik
  const [physicalExam, setPhysicalExam] = useState<string>(DEFAULT_PHYSICAL_EXAM);
  const [primaryIcdCode, setPrimaryIcdCode] = useState<string>(DEFAULT_ICD_CODE);
  const [primaryIcdDesc, setPrimaryIcdDesc] = useState<string>(DEFAULT_ICD_DESC);
  const [secondaryDiagnosis, setSecondaryDiagnosis] = useState<string>('');
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [actionNotesById, setActionNotesById] = useState<Record<string, string>>({});
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionDraftItem[]>([]);
  const [nextStatus, setNextStatus] = useState<NextStatus>('PHARMACY');

  // State Validasi & Submit
  const [icdCodeTouched, setIcdCodeTouched] = useState<boolean>(false);
  const [icdDescTouched, setIcdDescTouched] = useState<boolean>(false);
  const [prescriptionTouched, setPrescriptionTouched] = useState<boolean>(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetExamDefaults = useCallback(() => {
    setPhysicalExam(DEFAULT_PHYSICAL_EXAM);
    setPrimaryIcdCode(DEFAULT_ICD_CODE);
    setPrimaryIcdDesc(DEFAULT_ICD_DESC);
    setSecondaryDiagnosis('');
    setDoctorNotes('');
    setSelectedActions([]);
    setActionNotesById({});
    setPrescriptionItems([]);
    setNextStatus('PHARMACY');
    setIcdCodeTouched(false);
    setIcdDescTouched(false);
    setPrescriptionTouched(false);
    setSubmitError(null);
  }, []);

  const fetchDoctorWorkspaceData = useCallback(async () => {
    const [regRes, actionsRes, medRes] = await Promise.all([
      apiClient<{ data: DoctorQueuePatient[] }>('/registrations'),
      apiClient<{ data: MedicalActionItem[] }>('/medical-actions'),
      apiClient<{ data: MedicineOption[] }>('/medicines', {
        params: { active_only: true },
      }).catch(() => ({ data: [] as MedicineOption[] })),
    ]);

    const docQueue = (Array.isArray(regRes.data) ? regRes.data : []).filter(
      (r) => r.status === 'WAITING_DOCTOR' || r.status === 'IN_DOCTOR'
    );
    const medicalActions = Array.isArray(actionsRes.data) ? actionsRes.data : [];
    const medicines = Array.isArray(medRes.data) ? medRes.data : [];

    return { docQueue, medicalActions, medicines };
  }, []);

  const loadDoctorQueue = useCallback(
    async (notifyUser = false) => {
      setIsLoadingQueue(true);
      setError(null);
      try {
        const { docQueue, medicalActions, medicines } = await fetchDoctorWorkspaceData();
        setQueue(docQueue);
        setActionsList(medicalActions);
        setMedicinesList(medicines);

        if (notifyUser) {
          showToast({
            body: `Antrean diperbarui (${docQueue.length} pasien).`,
            uniqueID: 'doctor-queue-refresh',
          });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Gagal memuat antrean konsultasi dokter.'
        );
      } finally {
        setIsLoadingQueue(false);
      }
    },
    [fetchDoctorWorkspaceData, showToast]
  );

  useEffect(() => {
    let isCancelled = false;
    fetchDoctorWorkspaceData()
      .then(({ docQueue, medicalActions, medicines }) => {
        if (!isCancelled) {
          setQueue(docQueue);
          setActionsList(medicalActions);
          setMedicinesList(medicines);
          setError(null);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : 'Gagal memuat antrean konsultasi dokter.'
          );
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingQueue(false);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [fetchDoctorWorkspaceData]);

  const executeSelectPatient = useCallback(
    async (patient: DoctorQueuePatient) => {
      setSelectedPatient(patient);
      setCompletedBanner(null);
      setIsMobileQueueOpen(false);
      resetExamDefaults();
      setIsLoadingDetails(true);

      try {
        const res = await apiClient<{ data: NurseAssessmentData[] }>(
          '/nurse-assessments',
          {
            params: { registration_id: patient.id },
          }
        );
        const item = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null;
        setAssessment(item);
      } catch {
        setAssessment(null);
      } finally {
        setIsLoadingDetails(false);
      }
    },
    [resetExamDefaults]
  );

  const isFormDirty = useMemo(() => {
    if (!selectedPatient) return false;
    return (
      physicalExam !== DEFAULT_PHYSICAL_EXAM ||
      primaryIcdCode !== DEFAULT_ICD_CODE ||
      primaryIcdDesc !== DEFAULT_ICD_DESC ||
      secondaryDiagnosis.trim().length > 0 ||
      doctorNotes.trim().length > 0 ||
      selectedActions.length > 0 ||
      prescriptionItems.length > 0
    );
  }, [
    doctorNotes,
    physicalExam,
    prescriptionItems.length,
    primaryIcdCode,
    primaryIcdDesc,
    secondaryDiagnosis,
    selectedActions.length,
    selectedPatient,
  ]);

  const handleRequestSelectPatient = (patient: DoctorQueuePatient) => {
    if (selectedPatient?.id === patient.id) {
      setIsMobileQueueOpen(false);
      return;
    }
    if (isFormDirty) {
      setPendingPatientSwitch(patient);
      setIsCancelConfirmOpen(true);
      return;
    }
    executeSelectPatient(patient);
  };

  const handleRequestClosePatient = () => {
    if (isFormDirty) {
      setPendingPatientSwitch(null);
      setIsCancelConfirmOpen(true);
      return;
    }
    setSelectedPatient(null);
    setAssessment(null);
  };

  // Lookup Maps
  const actionsById = useMemo(
    () => new Map(actionsList.map((act) => [String(act.id), act])),
    [actionsList]
  );

  const medicinesById = useMemo(
    () => new Map(medicinesList.map((med) => [String(med.id), med])),
    [medicinesList]
  );

  const medicineOptions = useMemo<React.ComponentProps<typeof Selector>['options']>(
    () =>
      medicinesList.map((med) => ({
        value: String(med.id),
        label: med.name,
        description: `${med.code} · Stok: ${med.stock} ${med.unit} · Rp ${Number(med.unit_price).toLocaleString('id-ID')}`,
        disabled: med.stock <= 0,
      })),
    [medicinesList]
  );

  // Kalkulasi Tarif Tindakan & Resep
  const totalActionTariff = useMemo(
    () =>
      selectedActions.reduce((sum, idStr) => {
        const act = actionsById.get(idStr);
        return sum + (act ? Number(act.tariff) : 0);
      }, 0),
    [actionsById, selectedActions]
  );

  const requestedQtyByMedicineId = useMemo(() => {
    const totals = new Map<string, number>();
    for (const item of prescriptionItems) {
      if (!item.medicineId || !item.quantity || item.quantity <= 0) continue;
      totals.set(item.medicineId, (totals.get(item.medicineId) ?? 0) + item.quantity);
    }
    return totals;
  }, [prescriptionItems]);

  const totalPrescriptionPrice = useMemo(
    () =>
      prescriptionItems.reduce((sum, item) => {
        const med = medicinesById.get(item.medicineId);
        const qty = item.quantity ?? 0;
        return sum + (med && qty > 0 ? Number(med.unit_price) * qty : 0);
      }, 0),
    [medicinesById, prescriptionItems]
  );

  // Validasi ICD-10 & e-Resep
  const icdCodeTrimmed = primaryIcdCode.trim();
  const icdDescTrimmed = primaryIcdDesc.trim();
  const isIcdFormatWarning =
    icdCodeTrimmed.length > 0 && !isValidIcd10Code(icdCodeTrimmed);

  const icdCodeError =
    icdCodeTrimmed.length === 0 ? 'Kode ICD-10 utama wajib diisi.' : undefined;
  const icdDescError =
    icdDescTrimmed.length === 0 ? 'Deskripsi diagnosis utama wajib diisi.' : undefined;

  const prescriptionRowErrors = useMemo(() => {
    return prescriptionItems.map((item) => {
      const med = item.medicineId ? medicinesById.get(item.medicineId) : undefined;
      const totalRequested = item.medicineId
        ? requestedQtyByMedicineId.get(item.medicineId) ?? 0
        : 0;

      const medicineError = !item.medicineId ? 'Pilih obat terlebih dahulu.' : undefined;
      const quantityError =
        !item.quantity || item.quantity <= 0
          ? 'Jumlah wajib > 0.'
          : med && totalRequested > med.stock
            ? `Melebihi stok tersedia (${med.stock} ${med.unit}).`
            : undefined;
      const dosageError = !item.dosage.trim() ? 'Dosis wajib diisi.' : undefined;
      const frequencyError = !item.frequency.trim() ? 'Aturan pakai wajib diisi.' : undefined;

      return {
        medicineError,
        quantityError,
        dosageError,
        frequencyError,
        hasError: Boolean(medicineError || quantityError || dosageError || frequencyError),
      };
    });
  }, [medicinesById, prescriptionItems, requestedQtyByMedicineId]);

  const hasPrescriptionErrors = prescriptionRowErrors.some((err) => err.hasError);
  const hasPrescriptions = prescriptionItems.length > 0;
  const isBillingBlockedByPrescription = hasPrescriptions && nextStatus === 'BILLING';

  const isFormValid =
    !icdCodeError &&
    !icdDescError &&
    !hasPrescriptionErrors &&
    !isBillingBlockedByPrescription;

  // Handlers e-Resep
  const handleAddPrescriptionItem = () => {
    const firstAvailableMed = medicinesList.find((m) => m.stock > 0);
    setPrescriptionItems((prev) => [
      ...prev,
      createEmptyPrescriptionDraft(firstAvailableMed ? String(firstAvailableMed.id) : ''),
    ]);
    if (nextStatus === 'BILLING') {
      setNextStatus('PHARMACY');
      showToast({
        body: 'Tujuan tindak lanjut otomatis diarahkan ke Farmasi karena ada resep obat.',
        uniqueID: 'doctor-auto-pharmacy',
      });
    }
  };

  const handleUpdatePrescriptionItem = (
    key: string,
    patch: Partial<PrescriptionDraftItem>
  ) => {
    setPrescriptionItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item))
    );
  };

  const handleRemovePrescriptionItem = (key: string) => {
    setPrescriptionItems((prev) => prev.filter((item) => item.key !== key));
  };

  const filteredQueue = useMemo(() => {
    const q = queueSearch.trim().toLowerCase();
    return queue.filter((p) => {
      if (insuranceFilter !== 'ALL' && p.insurance_type !== insuranceFilter) {
        return false;
      }
      if (!q) return true;
      const pName = (p.patient?.name || '').toLowerCase();
      const rmNo = (p.patient?.medical_record_number || '').toLowerCase();
      const qNo = (p.queue_number || '').toLowerCase();
      return pName.includes(q) || rmNo.includes(q) || qNo.includes(q);
    });
  }, [insuranceFilter, queue, queueSearch]);

  const handleSubmitExamination = async () => {
    if (!selectedPatient) return;

    setIcdCodeTouched(true);
    setIcdDescTouched(true);
    setPrescriptionTouched(true);
    setSubmitError(null);

    if (icdCodeError || icdDescError) {
      setSubmitError('Diagnosis ICD-10 utama (kode dan deskripsi) wajib dilengkapi.');
      return;
    }

    if (hasPrescriptionErrors) {
      setSubmitError('Periksa kembali rincian obat e-Resep (obat, jumlah, dosis, aturan pakai).');
      return;
    }

    if (isBillingBlockedByPrescription) {
      setSubmitError('Pasien dengan e-Resep harus diteruskan ke Farmasi atau disimpan sementara.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        registration_id: selectedPatient.id,
        doctor_id: selectedPatient.doctor?.id || 1,
        physical_exam: physicalExam.trim(),
        primary_diagnosis_code: icdCodeTrimmed,
        primary_diagnosis_desc: icdDescTrimmed,
        secondary_diagnosis: secondaryDiagnosis.trim(),
        doctor_notes: doctorNotes.trim(),
        next_status: nextStatus,
        actions: selectedActions.map((actionIdStr) => {
          const note = (actionNotesById[actionIdStr] || '').trim();
          return note
            ? { action_id: Number(actionIdStr), notes: note }
            : { action_id: Number(actionIdStr) };
        }),
        prescription_items: prescriptionItems.map((item) => {
          const instr = item.instructions.trim();
          return {
            medicine_id: Number(item.medicineId),
            quantity: Number(item.quantity),
            dosage: item.dosage.trim(),
            frequency: item.frequency.trim(),
            ...(instr ? { instructions: instr } : {}),
          };
        }),
      };

      await apiClient('/examinations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const destinationLabel =
        nextStatus === 'PHARMACY'
          ? 'Instalasi Farmasi (e-Resep)'
          : nextStatus === 'BILLING'
            ? 'Kasir Billing'
            : 'Status Sedang Diperiksa Dokter';

      const patientLabel = selectedPatient.patient?.name || selectedPatient.queue_number;
      const doneMsg = `Pemeriksaan ${patientLabel} berhasil disimpan (${destinationLabel}).`;

      showToast({
        body: doneMsg,
        uniqueID: 'doctor-exam-save-success',
      });

      setSelectedPatient(null);
      setAssessment(null);
      setCompletedBanner(doneMsg);
      loadDoctorQueue(false);
    } catch (err) {
      if (err instanceof ApiClientError && err.errors) {
        const firstFieldMsg = Object.values(err.errors).flat()[0];
        setSubmitError(firstFieldMsg || err.message);
      } else {
        setSubmitError(
          err instanceof Error
            ? err.message
            : 'Gagal menyimpan data pemeriksaan dokter.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const patientAge = useMemo(
    () => calculatePatientAge(selectedPatient?.patient?.birth_date),
    [selectedPatient?.patient?.birth_date]
  );

  const getCommitButtonLabel = () => {
    if (nextStatus === 'PHARMACY') return 'Simpan RME & Teruskan ke Farmasi';
    if (nextStatus === 'BILLING') return 'Simpan RME & Teruskan ke Kasir';
    return 'Simpan Pemeriksaan Sementara';
  };

  // Panel Daftar Antrean Pasien
  const queuePanelContent = (
    <VStack gap={3}>
      <HStack justify="between" align="center" gap={2}>
        <Heading level={2}>Antrean Dokter</Heading>
        <Badge variant="teal" label={filteredQueue.length} />
      </HStack>

      <TextInput
        label="Cari Pasien di Antrean Konsultasi"
        isLabelHidden
        type="search"
        size="sm"
        value={queueSearch}
        onChange={(val) => setQueueSearch(val)}
        placeholder="Cari nama, No. RM, antrean..."
        startIcon="search"
        hasClear
        width="100%"
      />

      <SegmentedControl
        label="Filter Penjamin Pasien"
        value={insuranceFilter}
        onChange={(val) => setInsuranceFilter(val as InsuranceFilter)}
        size="sm"
        layout="fill"
      >
        <SegmentedControlItem value="ALL" label="Semua" />
        <SegmentedControlItem value="BPJS" label="BPJS" />
        <SegmentedControlItem value="GENERAL" label="Umum" />
      </SegmentedControl>

      <Divider />

      {isLoadingQueue ? (
        <VStack gap={2}>
          <Skeleton height={52} radius={2} index={0} />
          <Skeleton height={52} radius={2} index={1} />
          <Skeleton height={52} radius={2} index={2} />
        </VStack>
      ) : filteredQueue.length === 0 ? (
        <EmptyState
          isCompact
          headingLevel={3}
          icon={<Icon icon="info" size="md" color="teal" />}
          title={queue.length === 0 ? 'Antrean Kosong' : 'Tidak Sesuai Filter'}
          description={
            queue.length === 0
              ? 'Pasien selesai triage akan tampil di sini.'
              : 'Sesuaikan kata kunci atau filter penjamin.'
          }
          actions={
            queue.length > 0 ? (
              <Button
                variant="secondary"
                size="sm"
                label="Reset Filter"
                onClick={() => {
                  setQueueSearch('');
                  setInsuranceFilter('ALL');
                }}
              />
            ) : undefined
          }
        />
      ) : (
        <List hasDividers density="balanced">
          {filteredQueue.map((p) => {
            const isInDoctor = p.status === 'IN_DOCTOR';
            return (
              <ListItem
                key={p.id}
                itemKey={p.id}
                isSelected={selectedPatient?.id === p.id}
                onClick={() => handleRequestSelectPatient(p)}
                align="start"
                label={
                  <HStack justify="between" align="center" gap={2}>
                    <Text weight="semibold">{p.patient?.name || 'Pasien'}</Text>
                    <Code>{p.queue_number}</Code>
                  </HStack>
                }
                description={
                  <VStack gap={1}>
                    <Code color="secondary">
                      {p.patient?.medical_record_number || '-'}
                    </Code>
                    <HStack gap={1.5} align="center" wrap="wrap">
                      <StatusDot
                        variant={isInDoctor ? 'accent' : 'warning'}
                        isPulsing={isInDoctor}
                        label={isInDoctor ? 'Sedang Diperiksa' : 'Menunggu'}
                      />
                      <Text type="supporting">
                        {isInDoctor ? 'Diperiksa' : 'Menunggu'}
                      </Text>
                      <Token
                        size="sm"
                        color={p.insurance_type === 'BPJS' ? 'green' : 'gray'}
                        label={p.insurance_type === 'BPJS' ? 'BPJS' : 'Umum'}
                      />
                    </HStack>
                  </VStack>
                }
              />
            );
          })}
        </List>
      )}
    </VStack>
  );

  // Area Kerja Utama Dokter
  const detailWorkspaceContent = selectedPatient ? (
    <VStack gap={4}>
      {/* Strip Identitas Pasien Ringkas */}
      <Card padding={4} elevation="low">
        <HStack justify="between" align="center" wrap="wrap" gap={3}>
          <HStack gap={3} align="center" wrap="wrap">
            <Avatar
              name={selectedPatient.patient?.name || 'Pasien'}
              size="md"
              shape="rounded"
              tooltip={false}
            />
            <VStack gap={0.5}>
              <HStack gap={2} align="center" wrap="wrap">
                <Code>{selectedPatient.queue_number}</Code>
                <Heading level={2}>
                  {selectedPatient.patient?.name || 'Pasien Tanpa Nama'}
                </Heading>
                <Token
                  size="sm"
                  color={selectedPatient.insurance_type === 'BPJS' ? 'green' : 'gray'}
                  label={selectedPatient.insurance_type === 'BPJS' ? 'BPJS' : 'Umum'}
                />
              </HStack>
              <HStack gap={1.5} align="center" wrap="wrap">
                <Code color="secondary">
                  {selectedPatient.patient?.medical_record_number || '-'}
                </Code>
                <Text color="secondary">
                  · {selectedPatient.patient?.gender === 'P' ? 'P' : 'L'}, {patientAge} thn
                  {selectedPatient.polyclinic?.name ? ` · ${selectedPatient.polyclinic.name}` : ''}
                  {selectedPatient.doctor?.name ? ` · ${selectedPatient.doctor.name}` : ''}
                </Text>
              </HStack>
            </VStack>
          </HStack>

          <Button
            variant="ghost"
            size="sm"
            icon={<Icon icon="close" />}
            label="Tutup"
            onClick={handleRequestClosePatient}
            isDisabled={isSubmitting}
          />
        </HStack>
      </Card>

      {/* Hasil Skrining Awal Perawat */}
      {isLoadingDetails ? (
        <Card padding={4} elevation="low">
          <VStack gap={2}>
            <Skeleton height={24} width="45%" radius={2} index={0} />
            <Skeleton height={56} radius={2} index={1} />
          </VStack>
        </Card>
      ) : assessment ? (
        <InitialAssessmentCard assessment={assessment} />
      ) : (
        <Banner
          status="warning"
          title="Belum Ada Data Skrining Triage"
          description="Pasien ini belum memiliki catatan TTV perawat."
          collapsible={false}
        />
      )}

      {/* Satu Kartu Utama Formulir Pemeriksaan RME, Tindakan & e-Resep Atomik */}
      <Card padding={0} elevation="low">
        {/* Bagian 1: Pemeriksaan Fisik (Objective) */}
        <Section variant="transparent" padding={4} dividers={['bottom']}>
          <VStack gap={3}>
            <HStack justify="between" align="center" wrap="wrap" gap={2}>
              <Heading level={3}>Pemeriksaan Fisik (Objective)</Heading>
              <Button
                variant="ghost"
                size="sm"
                label="Template DBN"
                onClick={() => setPhysicalExam(DEFAULT_PHYSICAL_EXAM)}
                isDisabled={isSubmitting}
              />
            </HStack>

            <FormLayout>
              <TextArea
                label="Temuan Pemeriksaan Fisik"
                value={physicalExam}
                onChange={(val) => setPhysicalExam(val)}
                isOptional
                rows={2}
                maxLength={1000}
                width="100%"
                placeholder="Contoh: Faring hiperemis (+), tonsil T1/T1..."
              />
            </FormLayout>
          </VStack>
        </Section>

        {/* Bagian 2: Diagnosis ICD-10 (Assessment) */}
        <Section variant="transparent" padding={4} dividers={['bottom']}>
          <VStack gap={3}>
            <HStack justify="between" align="center" wrap="wrap" gap={2}>
              <Heading level={3}>Diagnosis ICD-10 (Assessment)</Heading>
              <HStack gap={1.5} align="center" wrap="wrap">
                {COMMON_DIAGNOSIS_PRESETS.map((preset) => (
                  <Token
                    key={preset.code}
                    size="sm"
                    color={icdCodeTrimmed === preset.code ? 'teal' : 'gray'}
                    label={preset.code}
                    onClick={() => {
                      setPrimaryIcdCode(preset.code);
                      setPrimaryIcdDesc(preset.desc);
                      setIcdCodeTouched(true);
                      setIcdDescTouched(true);
                    }}
                  />
                ))}
              </HStack>
            </HStack>

            <FormLayout>
              <Grid columns={{ minWidth: 200, max: 2 }} gap={3}>
                <TextInput
                  label="Kode ICD-10 Utama"
                  value={primaryIcdCode}
                  onChange={(val) => setPrimaryIcdCode(val.toUpperCase().slice(0, 20))}
                  onBlur={() => setIcdCodeTouched(true)}
                  isRequired
                  hasAutoCorrect={false}
                  autoCapitalize="characters"
                  width="100%"
                  placeholder="Contoh: J06.9"
                  status={
                    icdCodeTouched && icdCodeError
                      ? { type: 'error', message: icdCodeError }
                      : isIcdFormatWarning
                        ? {
                            type: 'warning',
                            message: 'Format umum ICD-10: huruf + 2 digit (mis. J06.9).',
                          }
                        : undefined
                  }
                  statusVariant="detached"
                />

                <TextInput
                  label="Deskripsi Diagnosis Utama"
                  value={primaryIcdDesc}
                  onChange={(val) => setPrimaryIcdDesc(val.slice(0, 255))}
                  onBlur={() => setIcdDescTouched(true)}
                  isRequired
                  width="100%"
                  placeholder="Contoh: Infeksi saluran pernapasan akut atas"
                  status={
                    icdDescTouched && icdDescError
                      ? { type: 'error', message: icdDescError }
                      : undefined
                  }
                  statusVariant="detached"
                />
              </Grid>
            </FormLayout>

            <Collapsible
              defaultIsOpen={false}
              trigger={
                <HStack gap={2} align="center">
                  <Text weight="medium">Diagnosis Sekunder / Komorbiditas</Text>
                  <Token
                    size="sm"
                    color={secondaryDiagnosis.trim() ? 'teal' : 'gray'}
                    label={secondaryDiagnosis.trim() ? 'Terisi' : 'Opsional'}
                  />
                </HStack>
              }
            >
              <VStack gap={2} paddingBlockStart={2}>
                <FormLayout defaultOptionality="optional">
                  <TextInput
                    label="Diagnosis Sekunder"
                    value={secondaryDiagnosis}
                    onChange={(val) => setSecondaryDiagnosis(val)}
                    isOptional
                    width="100%"
                    placeholder="Contoh: Faringitis akut"
                  />
                </FormLayout>
              </VStack>
            </Collapsible>
          </VStack>
        </Section>

        {/* Bagian 3: Catatan Rencana & Tindakan Medis (Plan) */}
        <Section variant="transparent" padding={4} dividers={['bottom']}>
          <VStack gap={3}>
            <Heading level={3}>Rencana Terapi & Tindakan (Plan)</Heading>

            <FormLayout defaultOptionality="optional">
              <TextArea
                label="Catatan & Edukasi Dokter"
                value={doctorNotes}
                onChange={(val) => setDoctorNotes(val)}
                isOptional
                rows={2}
                maxLength={1000}
                width="100%"
                placeholder="Contoh: Istirahat cukup, minum air hangat, konsumsi obat sesuai aturan pakai..."
              />
            </FormLayout>

            <Collapsible
              defaultIsOpen={false}
              trigger={
                <HStack gap={2} align="center" wrap="wrap">
                  <Text weight="medium">Tindakan Medis Poliklinik</Text>
                  <Badge
                    variant={selectedActions.length > 0 ? 'teal' : 'neutral'}
                    label={selectedActions.length}
                  />
                  {selectedActions.length > 0 ? (
                    <Token
                      size="sm"
                      color="teal"
                      label={`Rp ${totalActionTariff.toLocaleString('id-ID')}`}
                    />
                  ) : (
                    <Token size="sm" color="gray" label="Opsional" />
                  )}
                </HStack>
              }
            >
              <VStack gap={3} paddingBlockStart={2}>
                {actionsList.length === 0 ? (
                  <Text color="secondary">
                    Tidak ada daftar tindakan medis tersedia.
                  </Text>
                ) : (
                  <VStack gap={2}>
                    <CheckboxList
                      label="Pilih Tindakan Medis"
                      value={selectedActions}
                      onChange={(vals) => setSelectedActions(vals)}
                      hasDividers
                      density="balanced"
                      isOptional
                      width="100%"
                    >
                      {actionsList.map((act) => (
                        <CheckboxListItem
                          key={act.id}
                          value={String(act.id)}
                          label={act.name}
                          description={
                            <HStack gap={1.5} align="center">
                              <Code color="secondary">{act.code}</Code>
                              <Text type="supporting">{act.category}</Text>
                            </HStack>
                          }
                          endContent={
                            <Text weight="semibold" hasTabularNumbers>
                              Rp {Number(act.tariff).toLocaleString('id-ID')}
                            </Text>
                          }
                        />
                      ))}
                    </CheckboxList>

                    {selectedActions.length > 0 ? (
                      <VStack gap={2} paddingBlockStart={1}>
                        {selectedActions.map((actIdStr) => {
                          const act = actionsById.get(actIdStr);
                          if (!act) return null;
                          return (
                            <TextInput
                              key={actIdStr}
                              label={`Catatan Tindakan: ${act.name}`}
                              size="sm"
                              isOptional
                              width="100%"
                              value={actionNotesById[actIdStr] || ''}
                              onChange={(val) =>
                                setActionNotesById((prev) => ({
                                  ...prev,
                                  [actIdStr]: val,
                                }))
                              }
                              placeholder="Catatan tindakan medis (opsional)..."
                            />
                          );
                        })}
                      </VStack>
                    ) : null}
                  </VStack>
                )}
              </VStack>
            </Collapsible>
          </VStack>
        </Section>

        {/* Bagian 4: e-Resep Obat Atomik */}
        <Section variant="transparent" padding={4} dividers={['bottom']}>
          <VStack gap={3}>
            <HStack justify="between" align="center" wrap="wrap" gap={2}>
              <HStack gap={2} align="center" wrap="wrap">
                <Heading level={3}>e-Resep Obat</Heading>
                <Badge
                  variant={hasPrescriptions ? 'teal' : 'neutral'}
                  label={prescriptionItems.length}
                />
                {hasPrescriptions ? (
                  <Token
                    size="sm"
                    color="teal"
                    label={`Estimasi: Rp ${totalPrescriptionPrice.toLocaleString('id-ID')}`}
                  />
                ) : null}
              </HStack>

              <Button
                variant="secondary"
                size="sm"
                label="+ Tambah Obat"
                onClick={handleAddPrescriptionItem}
                isDisabled={isSubmitting || medicinesList.length === 0}
              />
            </HStack>

            {medicinesList.length === 0 && prescriptionItems.length === 0 ? (
              <Text color="secondary">
                Master data obat belum tersedia atau stok kosong.
              </Text>
            ) : prescriptionItems.length === 0 ? (
              <Text color="secondary">
                Tidak ada resep obat. Klik &quot;+ Tambah Obat&quot; jika pasien memerlukan resep.
              </Text>
            ) : (
              <VStack gap={3}>
                {prescriptionItems.map((item, idx) => {
                  const selectedMed = item.medicineId
                    ? medicinesById.get(item.medicineId)
                    : undefined;
                  const rowErr = prescriptionRowErrors[idx];

                  return (
                    <Section key={item.key} variant="muted" padding={3}>
                      <VStack gap={2}>
                        <HStack justify="between" align="start" gap={2} wrap="wrap">
                          <StackItem size="fill">
                            <Grid columns={{ minWidth: 200, max: 2 }} gap={2}>
                              <Selector
                                label={`Obat #${idx + 1}`}
                                options={medicineOptions}
                                value={item.medicineId || undefined}
                                onChange={(val) =>
                                  handleUpdatePrescriptionItem(item.key, {
                                    medicineId: val || '',
                                  })
                                }
                                hasSearch
                                searchPlaceholder="Cari nama atau kode obat..."
                                placeholder="Pilih obat..."
                                presentation="adaptive"
                                isRequired
                                width="100%"
                                status={
                                  prescriptionTouched && rowErr?.medicineError
                                    ? { type: 'error', message: rowErr.medicineError }
                                    : undefined
                                }
                                statusVariant="detached"
                              />

                              <NumberInput
                                label="Jumlah"
                                value={item.quantity}
                                onChange={(val) =>
                                  handleUpdatePrescriptionItem(item.key, { quantity: val })
                                }
                                min={1}
                                max={999}
                                step={1}
                                isIntegerOnly
                                hasNumberSteppers
                                units={selectedMed?.unit || 'unit'}
                                description={
                                  selectedMed
                                    ? `Stok tersedia: ${selectedMed.stock} ${selectedMed.unit}`
                                    : undefined
                                }
                                isRequired
                                width="100%"
                                status={
                                  rowErr?.quantityError &&
                                  (prescriptionTouched ||
                                    Boolean(
                                      selectedMed &&
                                        (requestedQtyByMedicineId.get(item.medicineId) ?? 0) >
                                          selectedMed.stock
                                    ))
                                    ? { type: 'error', message: rowErr.quantityError }
                                    : undefined
                                }
                                statusVariant="detached"
                              />
                            </Grid>
                          </StackItem>

                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Icon icon="close" />}
                            label="Hapus Obat"
                            isIconOnly
                            onClick={() => handleRemovePrescriptionItem(item.key)}
                            isDisabled={isSubmitting}
                          />
                        </HStack>

                        <Grid columns={{ minWidth: 160, max: 3 }} gap={2}>
                          <TextInput
                            label="Dosis"
                            value={item.dosage}
                            onChange={(val) =>
                              handleUpdatePrescriptionItem(item.key, {
                                dosage: val.slice(0, 50),
                              })
                            }
                            isRequired
                            width="100%"
                            placeholder="Contoh: 500 mg"
                            status={
                              prescriptionTouched && rowErr?.dosageError
                                ? { type: 'error', message: rowErr.dosageError }
                                : undefined
                            }
                            statusVariant="detached"
                          />

                          <TextInput
                            label="Aturan Pakai"
                            value={item.frequency}
                            onChange={(val) =>
                              handleUpdatePrescriptionItem(item.key, {
                                frequency: val.slice(0, 50),
                              })
                            }
                            isRequired
                            width="100%"
                            placeholder="Contoh: 3x1 tablet sesudah makan"
                            status={
                              prescriptionTouched && rowErr?.frequencyError
                                ? { type: 'error', message: rowErr.frequencyError }
                                : undefined
                            }
                            statusVariant="detached"
                          />

                          <TextInput
                            label="Instruksi"
                            value={item.instructions}
                            onChange={(val) =>
                              handleUpdatePrescriptionItem(item.key, {
                                instructions: val.slice(0, 255),
                              })
                            }
                            isOptional
                            width="100%"
                            placeholder="Contoh: Bila demam atau nyeri"
                          />
                        </Grid>
                      </VStack>
                    </Section>
                  );
                })}
              </VStack>
            )}
          </VStack>
        </Section>

        {/* Bagian 5: Keputusan Tindak Lanjut & Simpan */}
        <Section variant="muted" padding={4}>
          <VStack gap={4}>
            <RadioList
              label="Tindak Lanjut Pasien"
              value={nextStatus}
              onChange={(val) => setNextStatus(val as NextStatus)}
              isRequired
              width="100%"
            >
              <RadioListItem
                value="PHARMACY"
                label="Teruskan ke Instalasi Farmasi (e-Resep)"
                description={
                  hasPrescriptions
                    ? 'Otomatis dipilih karena terdapat e-Resep obat.'
                    : 'Pasien menuju unit farmasi.'
                }
              />
              <RadioListItem
                value="BILLING"
                label="Langsung ke Kasir / Billing (Tanpa Resep Obat)"
                isDisabled={hasPrescriptions}
                description={
                  hasPrescriptions
                    ? 'Tidak tersedia saat ada item e-Resep obat.'
                    : 'Pasien selesai konsultasi dan menuju kasir.'
                }
              />
              <RadioListItem
                value="IN_DOCTOR"
                label="Simpan Sementara (Tetap di Ruang Dokter)"
                description="Catat RME sementara tanpa meneruskan pasien keluar poli."
              />
            </RadioList>

            {submitError ? (
              <Banner
                status="error"
                title="Pemeriksaan Belum Dapat Disimpan"
                description={submitError}
                collapsible={false}
                isDismissable
                onDismiss={() => setSubmitError(null)}
              />
            ) : null}

            <Divider />

            <HStack justify="end" align="center" wrap="wrap" gap={2}>
              <Button
                variant="secondary"
                size="md"
                label="Batal"
                onClick={handleRequestClosePatient}
                isDisabled={isSubmitting}
              />
              <Button
                variant="primary"
                size="md"
                icon={<Icon icon="check" />}
                label={getCommitButtonLabel()}
                isLoading={isSubmitting}
                isDisabled={!isFormValid || isSubmitting}
                onClick={handleSubmitExamination}
              />
            </HStack>
          </VStack>
        </Section>
      </Card>
    </VStack>
  ) : (
    <Card padding={6} elevation="none">
      <EmptyState
        headingLevel={2}
        icon={<Icon icon="info" size="lg" color="teal" />}
        title={
          queue.length > 0
            ? 'Pilih Pasien untuk Konsultasi'
            : 'Belum Ada Pasien di Antrean Dokter'
        }
        description={
          queue.length > 0
            ? 'Pilih pasien dari daftar di samping untuk melihat hasil skrining dan mengisi pemeriksaan RME.'
            : 'Pasien yang selesai skrining keperawatan akan tampil di sini.'
        }
        actions={
          queue.length > 0 ? (
            <Button
              variant="primary"
              size="md"
              icon={<Icon icon="chevronRight" />}
              label={`Periksa Antrean Berikutnya (${queue[0].queue_number} — ${queue[0].patient?.name || 'Pasien'})`}
              onClick={() => executeSelectPatient(queue[0])}
            />
          ) : (
            <Button
              variant="secondary"
              size="sm"
              label="Muat Ulang"
              onClick={() => loadDoctorQueue(true)}
            />
          )
        }
      />
    </Card>
  );

  return (
    <VStack gap={4}>
      <HStack justify="between" align="center" wrap="wrap" gap={3}>
        <HStack gap={2} align="center" wrap="wrap">
          <Heading level={1}>Konsultasi RME Dokter</Heading>
          <Badge variant="teal" label={queue.length} />
        </HStack>

        <HStack gap={2} align="center" wrap="wrap">
          {isCompactViewport ? (
            <Button
              variant="secondary"
              size="sm"
              icon={<Icon icon="menu" />}
              label={`Antrean (${queue.length})`}
              onClick={() => setIsMobileQueueOpen(true)}
            />
          ) : null}

          <Button
            variant="secondary"
            size="sm"
            label="Segarkan"
            isLoading={isLoadingQueue}
            onClick={() => loadDoctorQueue(true)}
          />
        </HStack>
      </HStack>

      {completedBanner ? (
        <Banner
          status="success"
          title="Pemeriksaan Selesai"
          description={completedBanner}
          collapsible={false}
          isDismissable
          onDismiss={() => setCompletedBanner(null)}
        />
      ) : null}

      {error ? (
        <Banner
          status="error"
          title="Gagal Memuat Antrean"
          description={error}
          collapsible={false}
          endContent={
            <Button
              variant="secondary"
              size="sm"
              label="Coba Lagi"
              onClick={() => loadDoctorQueue(true)}
            />
          }
        />
      ) : null}

      <Card padding={0} elevation="low">
        <Layout
          height="auto"
          padding={0}
          start={
            !isCompactViewport ? (
              <LayoutPanel
                width={320}
                hasDivider
                isScrollable={false}
                padding={4}
                label="Daftar Antrean Konsultasi Dokter"
              >
                {queuePanelContent}
              </LayoutPanel>
            ) : undefined
          }
          content={
            <LayoutContent
              padding={4}
              isScrollable={false}
              label="Lembar Konsultasi Rekam Medis Dokter"
            >
              {detailWorkspaceContent}
            </LayoutContent>
          }
        />
      </Card>

      {isCompactViewport ? (
        <BottomSheet
          isOpen={isMobileQueueOpen}
          onOpenChange={setIsMobileQueueOpen}
          height="tall"
          purpose="info"
          label="Daftar Antrean Konsultasi Dokter"
        >
          {queuePanelContent}
        </BottomSheet>
      ) : null}

      <AlertDialog
        isOpen={isCancelConfirmOpen}
        onOpenChange={setIsCancelConfirmOpen}
        title={
          pendingPatientSwitch
            ? 'Beralih ke Pasien Lain?'
            : 'Tutup Lembar Konsultasi?'
        }
        description="Perubahan pemeriksaan RME yang belum disimpan akan hilang jika Anda melanjutkan."
        cancelLabel="Kembali ke Formulir"
        actionLabel={
          pendingPatientSwitch ? 'Ya, Beralih' : 'Ya, Tutup'
        }
        actionVariant="destructive"
        onAction={() => {
          setIsCancelConfirmOpen(false);
          if (pendingPatientSwitch) {
            const target = pendingPatientSwitch;
            setPendingPatientSwitch(null);
            executeSelectPatient(target);
          } else {
            setSelectedPatient(null);
            setAssessment(null);
          }
        }}
      />
    </VStack>
  );
};
