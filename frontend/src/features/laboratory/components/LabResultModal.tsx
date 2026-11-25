import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { Banner } from '@astryxdesign/core/Banner';
import { Badge } from '@astryxdesign/core/Badge';
import { Token } from '@astryxdesign/core/Token';
import { Button } from '@astryxdesign/core/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@astryxdesign/core/Table';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Selector } from '@astryxdesign/core/Selector';
import { VStack, HStack, StackItem } from '@astryxdesign/core/Stack';
import { Section } from '@astryxdesign/core/Section';
import { Text } from '@astryxdesign/core/Text';
import { Code } from '@astryxdesign/core/Code';
import { Icon } from '@astryxdesign/core/Icon';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { ENV } from '@/config/env';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/features/auth';

export type LabStatusFlag = 'NORMAL' | 'ABNORMAL' | 'HIGH' | 'LOW';
export type LabOrderStatus = 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface LabOrderItem {
  id: number;
  test_name: string;
  test_code: string;
  result_value: string | null;
  reference_range: string | null;
  unit: string | null;
  status_flag: LabStatusFlag | null;
  tariff: number;
  notes: string | null;
}

export interface LabOrderDetail {
  id: number;
  order_number: string;
  examination_id?: number;
  registration_id?: number;
  patient_id?: number;
  patient_name: string;
  medical_record_number: string;
  patient_nik_masked?: string | null;
  patient_phone_masked?: string | null;
  doctor_id?: number;
  doctor_name: string;
  polyclinic_name: string;
  clinical_notes: string | null;
  ordered_at?: string;
  completed_at?: string | null;
  completed_by?: number | null;
  status: LabOrderStatus;
  items: LabOrderItem[];
}

export interface LabResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: LabOrderDetail | null;
  onSuccess: () => void;
}

interface ResultDraftItem {
  id: number;
  test_name: string;
  test_code: string;
  result_value: string;
  reference_range: string;
  unit: string;
  status_flag: LabStatusFlag;
  notes: string;
}

const FLAG_OPTIONS: Array<{ value: LabStatusFlag; label: string }> = [
  { value: 'NORMAL', label: 'NORMAL' },
  { value: 'ABNORMAL', label: 'ABNORMAL' },
  { value: 'HIGH', label: 'TINGGI (HIGH)' },
  { value: 'LOW', label: 'RENDAH (LOW)' },
];

function normalizeFlag(flag: LabOrderItem['status_flag']): LabStatusFlag {
  if (flag === 'ABNORMAL' || flag === 'HIGH' || flag === 'LOW') {
    return flag;
  }
  return 'NORMAL';
}

function mapItemsFromOrder(source: LabOrderDetail): ResultDraftItem[] {
  return source.items.map((item) => ({
    id: item.id,
    test_name: item.test_name,
    test_code: item.test_code,
    result_value: item.result_value || '',
    reference_range: item.reference_range || '',
    unit: item.unit || '',
    status_flag: normalizeFlag(item.status_flag),
    notes: item.notes || '',
  }));
}

function getStatusBadgeProps(status: LabOrderStatus): {
  variant: 'warning' | 'info' | 'success' | 'neutral';
  label: string;
} {
  switch (status) {
    case 'REQUESTED':
      return { variant: 'warning', label: 'Menunggu Sampel' };
    case 'IN_PROGRESS':
      return { variant: 'info', label: 'Sedang Diuji' };
    case 'COMPLETED':
      return { variant: 'success', label: 'Selesai' };
    case 'CANCELLED':
      return { variant: 'neutral', label: 'Dibatalkan' };
  }
}

const LabResultModalContent: React.FC<{
  order: LabOrderDetail;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ order, onClose, onSuccess }) => {
  const { user } = useAuth();
  const canEditResults = !user || user.role === 'admin' || user.role === 'lab';

  const [detailOrder, setDetailOrder] = useState<LabOrderDetail>(order);
  const [itemsData, setItemsData] = useState<ResultDraftItem[]>(() =>
    mapItemsFromOrder(order)
  );
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient<{ success: boolean; data: LabOrderDetail }>(
      `${ENV.ANCILLARY_BASE_URL}/laboratory/orders/${order.id}`
    )
      .then((res) => {
        if (cancelled) return;
        if (res?.data && Array.isArray(res.data.items)) {
          setDetailOrder(res.data);
          setItemsData(mapItemsFromOrder(res.data));
        }
      })
      .catch(() => {
        // Pertahankan data awal dari daftar kerja bila sinkronisasi detail gagal
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingDetail(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [order.id]);

  const isReadOnly =
    detailOrder.status === 'COMPLETED' ||
    detailOrder.status === 'CANCELLED' ||
    !canEditResults;

  const abnormalCount = useMemo(
    () => itemsData.filter((item) => item.status_flag !== 'NORMAL').length,
    [itemsData]
  );

  const handleItemChange = <K extends keyof ResultDraftItem>(
    index: number,
    field: K,
    value: ResultDraftItem[K]
  ) => {
    setItemsData((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const handleTransitionStatus = async (
    nextStatus: 'IN_PROGRESS' | 'CANCELLED',
    notes: string
  ) => {
    setIsUpdatingStatus(true);
    setErrorMessage(null);
    try {
      await apiClient(
        `${ENV.ANCILLARY_BASE_URL}/laboratory/orders/${detailOrder.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: nextStatus,
            notes,
          }),
        }
      );

      if (nextStatus === 'IN_PROGRESS') {
        setDetailOrder((prev) => ({ ...prev, status: 'IN_PROGRESS' }));
        onSuccess();
      } else {
        setIsCancelConfirmOpen(false);
        onSuccess();
        onClose();
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Gagal memperbarui status order laboratorium.'
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSubmitResults = async () => {
    const emptyItems = itemsData.filter((i) => !i.result_value.trim());
    if (emptyItems.length > 0) {
      setErrorMessage(
        `Harap isi nilai hasil untuk seluruh parameter (${emptyItems.length} belum diisi).`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const numericUserId = Number(user?.id);
      const completedBy =
        Number.isInteger(numericUserId) && numericUserId > 0 ? numericUserId : undefined;

      const payload = {
        ...(completedBy !== undefined ? { completed_by: completedBy } : {}),
        items: itemsData.map((item) => ({
          id: item.id,
          result_value: item.result_value.trim(),
          reference_range: item.reference_range.trim() || null,
          unit: item.unit.trim() || null,
          status_flag: item.status_flag,
          notes: item.notes.trim() || null,
        })),
      };

      await apiClient(
        `${ENV.ANCILLARY_BASE_URL}/laboratory/orders/${detailOrder.id}/results`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError && err.errors) {
        const firstMsg = Object.values(err.errors).flat()[0];
        setErrorMessage(firstMsg || err.message);
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : 'Gagal menyimpan hasil laboratorium.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadge = getStatusBadgeProps(detailOrder.status);
  const piiSummary = [
    detailOrder.patient_nik_masked ? `NIK: ${detailOrder.patient_nik_masked}` : null,
    detailOrder.patient_phone_masked ? `Telp: ${detailOrder.patient_phone_masked}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <Dialog
        isOpen={true}
        onOpenChange={(open) => {
          if (!open && !isSubmitting && !isUpdatingStatus) onClose();
        }}
        width={960}
        maxHeight="88dvh"
        padding={0}
        purpose={isReadOnly ? 'info' : 'form'}
      >
        <Layout
          height="fill"
          padding={5}
          defaultHasDividers
          header={
            <DialogHeader
              title={
                isReadOnly
                  ? 'Detail Hasil Laboratorium'
                  : 'Input & Verifikasi Hasil Laboratorium'
              }
              subtitle={`${detailOrder.order_number} · ${detailOrder.patient_name} (${detailOrder.medical_record_number})`}
              endContent={
                <HStack gap={1.5} align="center">
                  <Badge variant={statusBadge.variant} label={statusBadge.label} />
                  {abnormalCount > 0 ? (
                    <Token
                      size="sm"
                      color="red"
                      icon={<Icon icon="warning" size="xsm" />}
                      label={`${abnormalCount} Abnormal`}
                    />
                  ) : null}
                </HStack>
              }
              onOpenChange={(open) => {
                if (!open && !isSubmitting && !isUpdatingStatus) onClose();
              }}
            />
          }
          content={
            <LayoutContent isScrollable>
              <VStack gap={4}>
                <Section variant="muted" padding={3}>
                  <VStack gap={1}>
                    <HStack justify="between" align="center" wrap="wrap" gap={2}>
                      <Text>
                        DPJP: {detailOrder.doctor_name} · {detailOrder.polyclinic_name}
                      </Text>
                      {piiSummary ? <Code color="secondary">{piiSummary}</Code> : null}
                    </HStack>
                    {detailOrder.clinical_notes ? (
                      <Text color="secondary">
                        Indikasi: {detailOrder.clinical_notes}
                      </Text>
                    ) : null}
                  </VStack>
                </Section>

                {!canEditResults &&
                detailOrder.status !== 'COMPLETED' &&
                detailOrder.status !== 'CANCELLED' ? (
                  <Banner
                    status="info"
                    title="Mode Lihat Saja"
                    description="Pengisian dan verifikasi hasil laboratorium hanya dapat dilakukan oleh petugas laboratorium atau admin."
                    collapsible={false}
                  />
                ) : null}

                {errorMessage ? (
                  <Banner
                    status="error"
                    title="Gagal Memproses Hasil"
                    description={errorMessage}
                    collapsible={false}
                    isDismissable
                    onDismiss={() => setErrorMessage(null)}
                  />
                ) : null}

                {isLoadingDetail && itemsData.length === 0 ? (
                  <VStack gap={2}>
                    <Skeleton height={40} radius={2} index={0} />
                    <Skeleton height={44} radius={2} index={1} />
                  </VStack>
                ) : (
                  <Table density="balanced" dividers="rows" hasHover>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Parameter Uji</TableHeaderCell>
                        <TableHeaderCell>Rujukan & Satuan</TableHeaderCell>
                        <TableHeaderCell>Hasil Uji</TableHeaderCell>
                        <TableHeaderCell>Flag Status</TableHeaderCell>
                        <TableHeaderCell>Catatan</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemsData.map((item, index) => {
                        const isFlagAbnormal = item.status_flag !== 'NORMAL';
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <VStack gap={0.5}>
                                <Text weight="semibold">{item.test_name}</Text>
                                <Code color="secondary">{item.test_code}</Code>
                              </VStack>
                            </TableCell>
                            <TableCell>
                              <Text color="secondary">
                                {item.reference_range || '-'} {item.unit}
                              </Text>
                            </TableCell>
                            <TableCell>
                              {isReadOnly ? (
                                <Code color={isFlagAbnormal ? 'primary' : 'secondary'}>
                                  {item.result_value || '-'} {item.unit}
                                </Code>
                              ) : (
                                <TextInput
                                  label={`Hasil ${item.test_name}`}
                                  isLabelHidden
                                  value={item.result_value}
                                  onChange={(val) =>
                                    handleItemChange(index, 'result_value', val)
                                  }
                                  placeholder="Nilai hasil..."
                                  size="sm"
                                  isRequired
                                  width={140}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {isReadOnly ? (
                                <Token
                                  size="sm"
                                  color={isFlagAbnormal ? 'red' : 'green'}
                                  icon={
                                    <Icon
                                      icon={isFlagAbnormal ? 'warning' : 'check'}
                                      size="xsm"
                                    />
                                  }
                                  label={item.status_flag}
                                />
                              ) : (
                                <Selector
                                  label={`Status ${item.test_name}`}
                                  isLabelHidden
                                  size="sm"
                                  value={item.status_flag}
                                  onChange={(val) =>
                                    handleItemChange(
                                      index,
                                      'status_flag',
                                      val as LabStatusFlag
                                    )
                                  }
                                  options={FLAG_OPTIONS}
                                  width={150}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {isReadOnly ? (
                                <Text color="secondary">{item.notes || '-'}</Text>
                              ) : (
                                <TextInput
                                  label={`Catatan ${item.test_name}`}
                                  isLabelHidden
                                  value={item.notes}
                                  onChange={(val) => handleItemChange(index, 'notes', val)}
                                  placeholder="Catatan klinis..."
                                  size="sm"
                                  width="100%"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </VStack>
            </LayoutContent>
          }
          footer={
            <LayoutFooter>
              <HStack justify="between" align="center" wrap="wrap" gap={2}>
                <StackItem size="fill">
                  {canEditResults &&
                  (detailOrder.status === 'REQUESTED' ||
                    detailOrder.status === 'IN_PROGRESS') ? (
                    <HStack gap={2} align="center" wrap="wrap">
                      {detailOrder.status === 'REQUESTED' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          label="Mulai Proses Sampel"
                          isLoading={isUpdatingStatus}
                          isDisabled={isSubmitting || isUpdatingStatus}
                          onClick={() =>
                            handleTransitionStatus(
                              'IN_PROGRESS',
                              'Sampel pasien telah diambil dan sedang dianalisis'
                            )
                          }
                        />
                      ) : null}

                      <Button
                        variant="ghost"
                        size="sm"
                        label="Batalkan Order"
                        isDisabled={isSubmitting || isUpdatingStatus}
                        onClick={() => setIsCancelConfirmOpen(true)}
                      />
                    </HStack>
                  ) : null}
                </StackItem>

                <HStack gap={2} align="center">
                  <Button
                    variant="secondary"
                    size="md"
                    label={isReadOnly ? 'Tutup' : 'Batal'}
                    onClick={onClose}
                    isDisabled={isSubmitting || isUpdatingStatus}
                  />
                  {!isReadOnly ? (
                    <Button
                      variant="primary"
                      size="md"
                      icon={<Icon icon="check" />}
                      label="Simpan & Verifikasi Hasil"
                      isDisabled={isSubmitting || isUpdatingStatus}
                      isLoading={isSubmitting}
                      onClick={handleSubmitResults}
                    />
                  ) : null}
                </HStack>
              </HStack>
            </LayoutFooter>
          }
        />
      </Dialog>

      <AlertDialog
        isOpen={isCancelConfirmOpen}
        onOpenChange={setIsCancelConfirmOpen}
        title={`Batalkan Order ${detailOrder.order_number}?`}
        description="Tarif parameter laboratorium akan dinolkan dan tagihan pasien dihitung ulang otomatis."
        cancelLabel="Kembali"
        actionLabel="Ya, Batalkan Order"
        actionVariant="destructive"
        isActionLoading={isUpdatingStatus}
        onAction={() =>
          handleTransitionStatus(
            'CANCELLED',
            'Order dibatalkan oleh petugas laboratorium'
          )
        }
      />
    </>
  );
};

export const LabResultModal: React.FC<LabResultModalProps> = ({
  isOpen,
  order,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !order) return null;
  return (
    <LabResultModalContent
      key={order.id}
      order={order}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};
