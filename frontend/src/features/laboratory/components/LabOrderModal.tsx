import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Selector } from '@astryxdesign/core/Selector';
import { CheckboxList, CheckboxListItem } from '@astryxdesign/core/CheckboxList';
import { FormLayout } from '@astryxdesign/core/FormLayout';
import { VStack, HStack, StackItem } from '@astryxdesign/core/Stack';
import { Section } from '@astryxdesign/core/Section';
import { Grid } from '@astryxdesign/core/Grid';
import { Text } from '@astryxdesign/core/Text';
import { Code } from '@astryxdesign/core/Code';
import { Token } from '@astryxdesign/core/Token';
import { Badge } from '@astryxdesign/core/Badge';
import { Icon } from '@astryxdesign/core/Icon';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { ENV } from '@/config/env';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { AVAILABLE_LAB_TESTS, type LabTestOption } from '../constants/lab-tests';

interface ExaminationOptionRecord {
  id: number;
  registration_id: number;
  primary_diagnosis_code?: string;
  primary_diagnosis_desc?: string;
  doctor?: {
    id: number;
    name: string;
  };
  registration?: {
    id: number;
    queue_number?: string;
    status?: string;
    patient?: {
      id: number;
      name: string;
      medical_record_number: string;
    };
  };
}

export interface LabOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  registrationId?: number;
  examinationId?: number;
  patientName?: string;
  medicalRecordNumber?: string;
  onSuccess: () => void;
}

const LabOrderModalContent: React.FC<Omit<LabOrderModalProps, 'isOpen'>> = ({
  onClose,
  registrationId: presetRegistrationId,
  examinationId: presetExaminationId,
  patientName: presetPatientName,
  medicalRecordNumber: presetMrn,
  onSuccess,
}) => {
  const isPresetVisit = Boolean(presetRegistrationId && presetExaminationId);

  const [examinations, setExaminations] = useState<ExaminationOptionRecord[]>([]);
  const [isLoadingVisits, setIsLoadingVisits] = useState<boolean>(!isPresetVisit);
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  const [selectedTestCodes, setSelectedTestCodes] = useState<string[]>([]);
  const [itemNotesByCode, setItemNotesByCode] = useState<Record<string, string>>({});
  const [customTests, setCustomTests] = useState<LabTestOption[]>([]);
  const [showCustomBuilder, setShowCustomBuilder] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customCode, setCustomCode] = useState<string>('');
  const [customRange, setCustomRange] = useState<string>('');
  const [customUnit, setCustomUnit] = useState<string>('');
  const [customTariff, setCustomTariff] = useState<number | null>(50000);

  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isPresetVisit) return;

    let cancelled = false;
    apiClient<{ data: ExaminationOptionRecord[] }>('/examinations')
      .then((res) => {
        if (cancelled) return;
        const activeExams = (Array.isArray(res.data) ? res.data : []).filter(
          (ex) => ex.registration?.status !== 'CANCELLED'
        );
        setExaminations(activeExams);
        if (activeExams.length > 0) {
          setSelectedExamId(String(activeExams[0].id));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : 'Gagal memuat daftar pemeriksaan pasien untuk order laboratorium.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingVisits(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isPresetVisit]);

  const allTests = useMemo(
    () => [...AVAILABLE_LAB_TESTS, ...customTests],
    [customTests]
  );

  const testsByCode = useMemo(
    () => new Map(allTests.map((t) => [t.test_code, t])),
    [allTests]
  );

  const selectedTests = useMemo(
    () =>
      selectedTestCodes
        .map((code) => testsByCode.get(code))
        .filter((item): item is LabTestOption => Boolean(item)),
    [selectedTestCodes, testsByCode]
  );

  const selectedExam = useMemo(
    () => examinations.find((ex) => String(ex.id) === selectedExamId),
    [examinations, selectedExamId]
  );

  const visitOptions = useMemo<React.ComponentProps<typeof Selector>['options']>(
    () =>
      examinations.map((ex) => {
        const pName = ex.registration?.patient?.name || `Pasien #${ex.registration_id}`;
        const mrn = ex.registration?.patient?.medical_record_number || '-';
        const queueNo = ex.registration?.queue_number || `REG-${ex.registration_id}`;
        const docName = ex.doctor?.name || 'Dokter DPJP';
        const diag = ex.primary_diagnosis_code ? ` · ${ex.primary_diagnosis_code}` : '';
        return {
          value: String(ex.id),
          label: `${pName} (${mrn})`,
          description: `${queueNo} · ${docName}${diag}`,
        };
      }),
    [examinations]
  );

  const effectiveRegistrationId = isPresetVisit
    ? presetRegistrationId
    : selectedExam?.registration_id;
  const effectiveExaminationId = isPresetVisit
    ? presetExaminationId
    : selectedExam?.id;
  const displayPatientName = isPresetVisit
    ? presetPatientName || 'Pasien Rawat Jalan'
    : selectedExam?.registration?.patient?.name || 'Pilih Pasien RME';
  const displayMrn = isPresetVisit
    ? presetMrn || '-'
    : selectedExam?.registration?.patient?.medical_record_number || '-';

  const totalTariff = useMemo(
    () => selectedTests.reduce((acc, t) => acc + Number(t.tariff || 0), 0),
    [selectedTests]
  );

  const handleAddCustomTest = () => {
    const trimmedName = customName.trim();
    if (!trimmedName) {
      setErrorMessage('Nama parameter uji kustom wajib diisi.');
      return;
    }
    const generatedCode =
      customCode.trim().toUpperCase().slice(0, 20) ||
      `CUST${String(customTests.length + 1).padStart(2, '0')}`;

    if (testsByCode.has(generatedCode)) {
      setErrorMessage(`Kode parameter ${generatedCode} sudah ada di daftar.`);
      return;
    }

    const nextTest: LabTestOption = {
      test_code: generatedCode,
      test_name: trimmedName.slice(0, 100),
      reference_range: customRange.trim() || 'Normal',
      unit: customUnit.trim() || '-',
      tariff: Math.max(0, Number(customTariff ?? 50000)),
    };

    setCustomTests((prev) => [...prev, nextTest]);
    setSelectedTestCodes((prev) => [...prev, generatedCode]);
    setCustomName('');
    setCustomCode('');
    setCustomRange('');
    setCustomUnit('');
    setCustomTariff(50000);
    setShowCustomBuilder(false);
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!effectiveRegistrationId || !effectiveExaminationId) {
      setErrorMessage(
        'Pilih kunjungan pasien yang sudah memiliki pemeriksaan dokter (RME).'
      );
      return;
    }

    if (selectedTests.length === 0) {
      setErrorMessage('Pilih minimal satu parameter pemeriksaan laboratorium.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        registration_id: effectiveRegistrationId,
        examination_id: effectiveExaminationId,
        clinical_notes: clinicalNotes.trim() || null,
        items: selectedTests.map((t) => {
          const itemNote = (itemNotesByCode[t.test_code] || '').trim();
          return {
            test_name: t.test_name,
            test_code: t.test_code,
            reference_range: t.reference_range,
            unit: t.unit,
            tariff: t.tariff,
            ...(itemNote ? { notes: itemNote } : {}),
          };
        }),
      };

      await apiClient(`${ENV.ANCILLARY_BASE_URL}/laboratory/orders`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError && err.errors) {
        const firstMsg = Object.values(err.errors).flat()[0];
        setErrorMessage(firstMsg || err.message);
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : 'Gagal mengirim permintaan laboratorium.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={true}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
      width={720}
      maxHeight="85dvh"
      padding={0}
      purpose="form"
    >
      <Layout
        height="fill"
        padding={5}
        defaultHasDividers
        header={
          <DialogHeader
            title="Buat Permintaan Laboratorium"
            subtitle={
              isPresetVisit
                ? `Pasien: ${displayPatientName} (${displayMrn})`
                : 'Pilih pasien dengan RME dokter, lalu tentukan parameter uji.'
            }
            onOpenChange={(open) => {
              if (!open && !isSubmitting) onClose();
            }}
          />
        }
        content={
          <LayoutContent isScrollable>
            <VStack gap={4}>
              {errorMessage ? (
                <Banner
                  status="error"
                  title="Permintaan Belum Dapat Dikirim"
                  description={errorMessage}
                  collapsible={false}
                  isDismissable
                  onDismiss={() => setErrorMessage(null)}
                />
              ) : null}

              <FormLayout>
                <VStack gap={4}>
                  {!isPresetVisit ? (
                    isLoadingVisits ? (
                      <Skeleton height={44} radius={2} index={0} />
                    ) : examinations.length === 0 ? (
                      <Banner
                        status="warning"
                        title="Belum Ada Pasien Dengan RME Dokter"
                        description="Order laboratorium memerlukan data pemeriksaan RME dokter terlebih dahulu."
                        collapsible={false}
                      />
                    ) : (
                      <Selector
                        label="Kunjungan Pasien (RME Dokter)"
                        options={visitOptions}
                        value={selectedExamId || undefined}
                        onChange={(val) => setSelectedExamId(val)}
                        hasSearch
                        searchPlaceholder="Cari nama, No. RM, atau antrean..."
                        placeholder="Pilih pasien..."
                        isRequired
                        width="100%"
                      />
                    )
                  ) : null}

                  <TextArea
                    label="Indikasi Klinis"
                    placeholder="Contoh: Evaluasi profil hematologi dan glukosa darah puasa"
                    value={clinicalNotes}
                    onChange={(val) => setClinicalNotes(val.slice(0, 2000))}
                    rows={2}
                    isOptional
                    width="100%"
                  />

                  <VStack gap={2}>
                    <HStack justify="between" align="center" wrap="wrap" gap={2}>
                      <HStack gap={2} align="center">
                        <Text weight="semibold">Parameter Pemeriksaan</Text>
                        <Badge
                          variant={selectedTests.length > 0 ? 'teal' : 'neutral'}
                          label={selectedTests.length}
                        />
                        {selectedTests.length > 0 ? (
                          <Token
                            size="sm"
                            color="teal"
                            label={`Estimasi: Rp ${totalTariff.toLocaleString('id-ID')}`}
                          />
                        ) : null}
                      </HStack>

                      <Button
                        variant="ghost"
                        size="sm"
                        label={
                          showCustomBuilder
                            ? 'Tutup Parameter Kustom'
                            : '+ Parameter Kustom'
                        }
                        onClick={() => setShowCustomBuilder((prev) => !prev)}
                        isDisabled={isSubmitting}
                      />
                    </HStack>

                    {showCustomBuilder ? (
                      <Section variant="muted" padding={3}>
                        <VStack gap={2}>
                          <Text weight="medium">Tambah Parameter Kustom</Text>
                          <Grid columns={{ minWidth: 150, max: 3 }} gap={2}>
                            <TextInput
                              label="Nama Parameter"
                              size="sm"
                              value={customName}
                              onChange={(val) => setCustomName(val)}
                              placeholder="Mis. HbA1c"
                              isRequired
                              width="100%"
                            />
                            <TextInput
                              label="Kode Uji"
                              size="sm"
                              value={customCode}
                              onChange={(val) => setCustomCode(val.toUpperCase())}
                              placeholder="HBA1C"
                              isOptional
                              width="100%"
                            />
                            <NumberInput
                              label="Tarif (Rp)"
                              size="sm"
                              value={customTariff}
                              onChange={(val) => setCustomTariff(val)}
                              min={0}
                              step={5000}
                              isIntegerOnly
                              width="100%"
                            />
                          </Grid>
                          <Grid columns={{ minWidth: 160, max: 2 }} gap={2}>
                            <TextInput
                              label="Nilai Rujukan"
                              size="sm"
                              value={customRange}
                              onChange={(val) => setCustomRange(val)}
                              placeholder="< 5.7"
                              isOptional
                              width="100%"
                            />
                            <TextInput
                              label="Satuan"
                              size="sm"
                              value={customUnit}
                              onChange={(val) => setCustomUnit(val)}
                              placeholder="%"
                              isOptional
                              width="100%"
                            />
                          </Grid>
                          <HStack justify="end">
                            <Button
                              variant="secondary"
                              size="sm"
                              label="Tambahkan ke Daftar"
                              onClick={handleAddCustomTest}
                            />
                          </HStack>
                        </VStack>
                      </Section>
                    ) : null}

                    <Section variant="muted" padding={2}>
                      <CheckboxList
                        label="Pilih Parameter Uji Laboratorium"
                        isLabelHidden
                        value={selectedTestCodes}
                        onChange={(vals) => setSelectedTestCodes(vals)}
                        hasDividers
                        density="compact"
                        width="100%"
                      >
                        {allTests.map((test) => (
                          <CheckboxListItem
                            key={test.test_code}
                            value={test.test_code}
                            label={test.test_name}
                            description={
                              <HStack gap={1.5} align="center" wrap="wrap">
                                <Code color="secondary">{test.test_code}</Code>
                                <Text type="supporting">
                                  Rujukan: {test.reference_range} {test.unit}
                                </Text>
                              </HStack>
                            }
                            endContent={
                              <Text weight="semibold" hasTabularNumbers>
                                Rp {test.tariff.toLocaleString('id-ID')}
                              </Text>
                            }
                          />
                        ))}
                      </CheckboxList>
                    </Section>

                    {selectedTests.length > 0 ? (
                      <VStack gap={2} paddingBlockStart={1}>
                        {selectedTests.map((t) => (
                          <TextInput
                            key={t.test_code}
                            label={`Catatan Sampel: ${t.test_name}`}
                            size="sm"
                            isOptional
                            width="100%"
                            value={itemNotesByCode[t.test_code] || ''}
                            onChange={(val) =>
                              setItemNotesByCode((prev) => ({
                                ...prev,
                                [t.test_code]: val,
                              }))
                            }
                            placeholder="Contoh: Darah EDTA / Puasa minimal 8 jam..."
                          />
                        ))}
                      </VStack>
                    ) : null}
                  </VStack>
                </VStack>
              </FormLayout>
            </VStack>
          </LayoutContent>
        }
        footer={
          <LayoutFooter>
            <HStack justify="between" align="center" wrap="wrap" gap={2}>
              <StackItem size="fill">
                <Text color="secondary">
                  {selectedTests.length > 0
                    ? `${selectedTests.length} parameter dipilih · Rp ${totalTariff.toLocaleString('id-ID')}`
                    : 'Pilih minimal 1 parameter uji'}
                </Text>
              </StackItem>

              <HStack gap={2} align="center">
                <Button
                  variant="secondary"
                  size="md"
                  label="Batal"
                  onClick={onClose}
                  isDisabled={isSubmitting}
                />
                <Button
                  variant="primary"
                  size="md"
                  icon={<Icon icon="check" />}
                  label="Kirim Permintaan Lab"
                  isDisabled={
                    isSubmitting ||
                    selectedTests.length === 0 ||
                    !effectiveRegistrationId ||
                    !effectiveExaminationId
                  }
                  isLoading={isSubmitting}
                  onClick={handleSubmit}
                />
              </HStack>
            </HStack>
          </LayoutFooter>
        }
      />
    </Dialog>
  );
};

export const LabOrderModal: React.FC<LabOrderModalProps> = ({ isOpen, ...props }) => {
  if (!isOpen) return null;
  return <LabOrderModalContent {...props} />;
};
