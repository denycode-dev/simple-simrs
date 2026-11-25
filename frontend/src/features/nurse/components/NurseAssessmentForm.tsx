import React, { useState, useMemo, useRef } from 'react';
import { Layout } from '@astryxdesign/core/Layout';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Card } from '@astryxdesign/core/Card';
import { Section } from '@astryxdesign/core/Section';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Code } from '@astryxdesign/core/Code';
import { Token } from '@astryxdesign/core/Token';
import { FormLayout } from '@astryxdesign/core/FormLayout';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { useToast } from '@astryxdesign/core/Toast';
import { apiClient, ApiClientError } from '@/lib/api-client';
import {
  DEFAULT_NO_ALLERGY_TEXT,
  calculatePatientAge,
  detectActiveAllergy,
  evaluateBmi,
  evaluateVitalSign,
  validateTriageForm,
} from '../utils/triage-helpers';

export interface NurseAssessmentRegistration {
  id: number;
  queue_number: string;
  insurance_type?: 'GENERAL' | 'BPJS';
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
  const showToast = useToast();
  const complaintRef = useRef<HTMLTextAreaElement>(null);

  // Nilai awal rentang fisiologis dewasa normal
  const [weightKg, setWeightKg] = useState<number | null>(65);
  const [heightCm, setHeightCm] = useState<number | null>(165);
  const [systolic, setSystolic] = useState<number | null>(120);
  const [diastolic, setDiastolic] = useState<number | null>(80);
  const [pulseRate, setPulseRate] = useState<number | null>(80);
  const [bodyTemp, setBodyTemp] = useState<number | null>(36.6);
  const [respiratoryRate, setRespiratoryRate] = useState<number | null>(18);

  // Keluhan & Alergi
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [allergyMode, setAllergyMode] = useState<'none' | 'has_allergy'>('none');
  const [allergyHistory, setAllergyHistory] = useState<string>(DEFAULT_NO_ALLERGY_TEXT);

  // Catatan Opsional
  const [diseaseHistory, setDiseaseHistory] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Status Validasi & Interaksi
  const [complaintTouched, setComplaintTouched] = useState<boolean>(false);
  const [allergyTouched, setAllergyTouched] = useState<boolean>(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const ageYears = useMemo(
    () => calculatePatientAge(registration.patient?.birth_date),
    [registration.patient?.birth_date]
  );

  const bmiResult = evaluateBmi(weightKg, heightCm);
  const systolicEval = evaluateVitalSign('systolic', systolic);
  const diastolicEval = evaluateVitalSign('diastolic', diastolic);
  const pulseEval = evaluateVitalSign('pulse', pulseRate);
  const tempEval = evaluateVitalSign('temp', bodyTemp);
  const respEval = evaluateVitalSign('respiratory', respiratoryRate);

  const abnormalVitalsCount = [
    systolicEval,
    diastolicEval,
    pulseEval,
    tempEval,
    respEval,
  ].filter((v) => v.severity !== 'normal').length;

  const effectiveAllergyText =
    allergyMode === 'none' ? DEFAULT_NO_ALLERGY_TEXT : allergyHistory;

  const allergyDetailError =
    allergyMode === 'has_allergy' && !detectActiveAllergy(allergyHistory)
      ? 'Sebutkan obat atau makanan pemicu alergi.'
      : undefined;

  const validation = validateTriageForm({
    weightKg,
    heightCm,
    systolic,
    diastolic,
    pulseRate,
    bodyTemp,
    respiratoryRate,
    chiefComplaint,
    allergyHistory: effectiveAllergyText,
  });

  const isFormDirty =
    chiefComplaint.trim().length > 0 ||
    diseaseHistory.trim().length > 0 ||
    notes.trim().length > 0 ||
    allergyMode === 'has_allergy';

  const handleAllergyModeChange = (mode: string) => {
    const nextMode = mode === 'has_allergy' ? 'has_allergy' : 'none';
    setAllergyMode(nextMode);
    setError(null);
    if (nextMode === 'none') {
      setAllergyHistory(DEFAULT_NO_ALLERGY_TEXT);
      setAllergyTouched(false);
    } else if (!detectActiveAllergy(allergyHistory)) {
      setAllergyHistory('');
    }
  };

  const handleResetVitalsDefault = () => {
    setSystolic(120);
    setDiastolic(80);
    setPulseRate(80);
    setBodyTemp(36.6);
    setRespiratoryRate(18);
    showToast({
      body: 'Tanda vital dikembalikan ke rentang normal.',
      uniqueID: 'triage-reset-vitals',
    });
  };

  const handleRequestCancel = () => {
    if (isFormDirty) {
      setIsCancelConfirmOpen(true);
      return;
    }
    onCancel();
  };

  const handleSubmit = async () => {
    setComplaintTouched(true);
    setAllergyTouched(true);
    setError(null);

    if (validation.complaintError) {
      complaintRef.current?.focus();
      return;
    }

    if (allergyDetailError || validation.allergyError) {
      return;
    }

    if (!validation.isValid) {
      setError(validation.firstErrorMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient('/nurse-assessments', {
        method: 'POST',
        body: JSON.stringify({
          registration_id: registration.id,
          nurse_id: 1,
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
          allergy_history: effectiveAllergyText.trim(),
          disease_history: diseaseHistory.trim(),
          notes: notes.trim(),
        }),
      });

      showToast({
        body: `Skrining ${registration.patient?.name || registration.queue_number} berhasil disimpan.`,
        uniqueID: 'triage-save-success',
      });
      onComplete();
    } catch (err) {
      if (err instanceof ApiClientError && err.errors) {
        const firstFieldMsg = Object.values(err.errors).flat()[0];
        setError(firstFieldMsg || err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Gagal menyimpan data skrining.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const secondaryFilledCount =
    (diseaseHistory.trim() ? 1 : 0) + (notes.trim() ? 1 : 0);

  const genderLabel = registration.patient?.gender === 'P' ? 'P' : 'L';
  const polyclinicInfo = [registration.polyclinic?.name, registration.doctor?.name]
    .filter(Boolean)
    .join(' · ');

  return (
    <Layout height="auto" contentWidth={760} padding={0}>
      <VStack gap={3}>
        {/* Navigasi Kembali & Judul Ringkas */}
        <HStack justify="between" align="center" wrap="wrap" gap={2}>
          <HStack gap={2} align="center">
            <Button
              variant="ghost"
              size="sm"
              icon={<Icon icon="chevronLeft" />}
              label="Antrean"
              onClick={handleRequestCancel}
              isDisabled={isSubmitting}
            />
            <Heading level={1}>Skrining Triage</Heading>
          </HStack>
        </HStack>

        {error ? (
          <Banner
            status="error"
            title="Belum Dapat Disimpan"
            description={error}
            collapsible={false}
            isDismissable
            onDismiss={() => setError(null)}
          />
        ) : null}

        <Card padding={0} elevation="low">
          {/* Strip Identitas Pasien Ringkas */}
          <Section variant="muted" padding={4} dividers={['bottom']}>
            <VStack gap={1}>
              <HStack justify="between" align="center" wrap="wrap" gap={2}>
                <HStack gap={2} align="center" wrap="wrap">
                  <Code>{registration.queue_number}</Code>
                  <Heading level={2}>
                    {registration.patient?.name || 'Pasien Tanpa Nama'}
                  </Heading>
                </HStack>

                {registration.insurance_type ? (
                  <Token
                    size="sm"
                    color={registration.insurance_type === 'BPJS' ? 'green' : 'gray'}
                    label={registration.insurance_type === 'BPJS' ? 'BPJS' : 'Umum'}
                  />
                ) : null}
              </HStack>

              <HStack gap={1.5} align="center" wrap="wrap">
                <Code color="secondary">
                  {registration.patient?.medical_record_number || '-'}
                </Code>
                <Text color="secondary">
                  · {genderLabel}, {ageYears} thn
                  {polyclinicInfo ? ` · ${polyclinicInfo}` : ''}
                </Text>
              </HStack>
            </VStack>
          </Section>

          {/* Bagian 1: Keluhan Utama & Alergi */}
          <Section variant="transparent" padding={5} dividers={['bottom']}>
            <VStack gap={4}>
              <FormLayout defaultEntryErrorBehavior="blur-or-enter">
                <TextArea
                  ref={complaintRef}
                  label="Keluhan Utama"
                  value={chiefComplaint}
                  onChange={(val) => {
                    setChiefComplaint(val);
                    if (error) setError(null);
                  }}
                  onBlur={() => setComplaintTouched(true)}
                  isRequired
                  hasAutoFocus
                  rows={2}
                  width="100%"
                  placeholder="Contoh: Demam dan batuk berdahak sejak 3 hari lalu..."
                  status={
                    complaintTouched && validation.complaintError
                      ? { type: 'error', message: validation.complaintError }
                      : undefined
                  }
                  statusVariant="detached"
                />
              </FormLayout>

              <VStack gap={2}>
                <HStack justify="between" align="center" wrap="wrap" gap={2}>
                  <Text weight="medium">Riwayat Alergi</Text>
                  <SegmentedControl
                    label="Riwayat Alergi"
                    value={allergyMode}
                    onChange={handleAllergyModeChange}
                    size="sm"
                  >
                    <SegmentedControlItem value="none" label="Tidak Ada" />
                    <SegmentedControlItem
                      value="has_allergy"
                      label="Ada Alergi"
                      icon={<Icon icon="warning" />}
                    />
                  </SegmentedControl>
                </HStack>

                {allergyMode === 'has_allergy' ? (
                  <FormLayout>
                    <TextInput
                      label="Detail Alergi Obat / Makanan"
                      value={allergyHistory}
                      onChange={(val) => setAllergyHistory(val)}
                      onBlur={() => setAllergyTouched(true)}
                      isRequired
                      hasAutoFocus
                      width="100%"
                      placeholder="Contoh: Amoksisilin (ruam kulit), Udang"
                      status={
                        allergyTouched && (allergyDetailError || validation.allergyError)
                          ? {
                              type: 'error',
                              message: allergyDetailError || validation.allergyError,
                            }
                          : undefined
                      }
                      statusVariant="detached"
                    />
                  </FormLayout>
                ) : null}
              </VStack>
            </VStack>
          </Section>

          {/* Bagian 2: Tanda Vital & Pengukuran Fisik */}
          <Section variant="transparent" padding={5} dividers={['bottom']}>
            <VStack gap={3}>
              <HStack justify="between" align="center" wrap="wrap" gap={2}>
                <Heading level={3}>Tanda Vital & Fisik</Heading>

                <HStack gap={2} align="center" wrap="wrap">
                  {abnormalVitalsCount > 0 ? (
                    <Token
                      size="sm"
                      color="orange"
                      icon={<Icon icon="warning" size="xsm" />}
                      label={`${abnormalVitalsCount} Di Luar Normal`}
                    />
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    label="Reset Normal"
                    onClick={handleResetVitalsDefault}
                    isDisabled={isSubmitting}
                  />
                </HStack>
              </HStack>

              <FormLayout defaultEntryErrorBehavior="blur-or-enter">
                <Grid columns={{ minWidth: 200, max: 2 }} gap={3}>
                  <NumberInput
                    label="Tekanan Darah Sistolik"
                    value={systolic}
                    onChange={(val) => setSystolic(val)}
                    min={50}
                    max={260}
                    step={1}
                    isIntegerOnly
                    units="mmHg"
                    isRequired
                    width="100%"
                    status={
                      validation.bpOrderError
                        ? { type: 'error', message: validation.bpOrderError }
                        : systolicEval.severity !== 'normal'
                          ? { type: 'warning', message: systolicEval.shortLabel }
                          : undefined
                    }
                    statusVariant="detached"
                  />

                  <NumberInput
                    label="Tekanan Darah Diastolik"
                    value={diastolic}
                    onChange={(val) => setDiastolic(val)}
                    min={30}
                    max={160}
                    step={1}
                    isIntegerOnly
                    units="mmHg"
                    isRequired
                    width="100%"
                    status={
                      validation.bpOrderError
                        ? { type: 'error', message: validation.bpOrderError }
                        : diastolicEval.severity !== 'normal'
                          ? { type: 'warning', message: diastolicEval.shortLabel }
                          : undefined
                    }
                    statusVariant="detached"
                  />
                </Grid>

                <Grid columns={{ minWidth: 160, max: 3 }} gap={3}>
                  <NumberInput
                    label="Frekuensi Nadi"
                    value={pulseRate}
                    onChange={(val) => setPulseRate(val)}
                    min={30}
                    max={220}
                    step={1}
                    isIntegerOnly
                    units="x/mnt"
                    isRequired
                    width="100%"
                    status={
                      pulseEval.severity !== 'normal'
                        ? { type: 'warning', message: pulseEval.shortLabel }
                        : undefined
                    }
                    statusVariant="detached"
                  />

                  <NumberInput
                    label="Suhu Tubuh"
                    value={bodyTemp}
                    onChange={(val) => setBodyTemp(val)}
                    min={34}
                    max={43}
                    step={0.1}
                    units="°C"
                    isRequired
                    width="100%"
                    status={
                      tempEval.severity !== 'normal'
                        ? { type: 'warning', message: tempEval.shortLabel }
                        : undefined
                    }
                    statusVariant="detached"
                  />

                  <NumberInput
                    label="Laju Pernapasan"
                    value={respiratoryRate}
                    onChange={(val) => setRespiratoryRate(val)}
                    min={8}
                    max={60}
                    step={1}
                    isIntegerOnly
                    units="x/mnt"
                    isRequired
                    width="100%"
                    status={
                      respEval.severity !== 'normal'
                        ? { type: 'warning', message: respEval.shortLabel }
                        : undefined
                    }
                    statusVariant="detached"
                  />
                </Grid>

                <Grid columns={{ minWidth: 160, max: 3 }} gap={3} align="end">
                  <NumberInput
                    label="Berat Badan"
                    value={weightKg}
                    onChange={(val) => setWeightKg(val)}
                    min={1}
                    max={300}
                    step={0.5}
                    units="kg"
                    isRequired
                    width="100%"
                  />

                  <NumberInput
                    label="Tinggi Badan"
                    value={heightCm}
                    onChange={(val) => setHeightCm(val)}
                    min={30}
                    max={250}
                    step={1}
                    units="cm"
                    isRequired
                    width="100%"
                  />

                  <Section variant="muted" padding={2}>
                    <VStack gap={0.5}>
                      <Text type="supporting">IMT Otomatis</Text>
                      <HStack gap={1.5} align="center" wrap="wrap">
                        <Text weight="semibold" hasTabularNumbers>
                          {bmiResult.bmiFormatted} kg/m²
                        </Text>
                        <Token
                          size="sm"
                          color={bmiResult.evaluation.tokenColor}
                          label={bmiResult.evaluation.shortLabel}
                        />
                      </HStack>
                    </VStack>
                  </Section>
                </Grid>
              </FormLayout>
            </VStack>
          </Section>

          {/* Bagian 3: Catatan Tambahan Opsional */}
          <Section variant="transparent" padding={4} dividers={['bottom']}>
            <Collapsible
              defaultIsOpen={false}
              trigger={
                <HStack gap={2} align="center" wrap="wrap">
                  <Text weight="medium">Riwayat Penyakit & Catatan Tambahan</Text>
                  <Token
                    size="sm"
                    color={secondaryFilledCount > 0 ? 'teal' : 'gray'}
                    label={
                      secondaryFilledCount > 0
                        ? `${secondaryFilledCount} Terisi`
                        : 'Opsional'
                    }
                  />
                </HStack>
              }
            >
              <VStack gap={3} paddingBlockStart={3}>
                <FormLayout defaultOptionality="optional">
                  <TextInput
                    label="Riwayat Penyakit Terdahulu"
                    value={diseaseHistory}
                    onChange={(val) => setDiseaseHistory(val)}
                    isOptional
                    width="100%"
                    placeholder="Contoh: Hipertensi, Diabetes Melitus, Asma..."
                  />

                  <TextInput
                    label="Catatan Khusus Perawat"
                    value={notes}
                    onChange={(val) => setNotes(val)}
                    isOptional
                    width="100%"
                    placeholder="Contoh: Risiko jatuh, memakai kursi roda..."
                  />
                </FormLayout>
              </VStack>
            </Collapsible>
          </Section>

          {/* Bar Aksi Bawah */}
          <Section variant="muted" padding={4}>
            <HStack justify="end" align="center" wrap="wrap" gap={2}>
              <Button
                variant="secondary"
                size="md"
                label="Batal"
                onClick={handleRequestCancel}
                isDisabled={isSubmitting}
              />
              <Button
                variant="primary"
                size="md"
                icon={<Icon icon="check" />}
                label="Simpan & Teruskan ke Dokter"
                isLoading={isSubmitting}
                isDisabled={isSubmitting}
                onClick={handleSubmit}
              />
            </HStack>
          </Section>
        </Card>

        <AlertDialog
          isOpen={isCancelConfirmOpen}
          onOpenChange={setIsCancelConfirmOpen}
          title="Batalkan Pengisian Skrining?"
          description="Perubahan skrining pasien ini belum disimpan dan akan hilang jika Anda kembali ke antrean."
          cancelLabel="Lanjutkan Mengisi"
          actionLabel="Ya, Kembali"
          actionVariant="destructive"
          onAction={() => {
            setIsCancelConfirmOpen(false);
            onCancel();
          }}
        />
      </VStack>
    </Layout>
  );
};
