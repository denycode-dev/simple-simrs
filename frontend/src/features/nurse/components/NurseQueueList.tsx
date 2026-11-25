import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Card } from '@astryxdesign/core/Card';
import { Section } from '@astryxdesign/core/Section';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Code } from '@astryxdesign/core/Code';
import { Badge } from '@astryxdesign/core/Badge';
import { Token } from '@astryxdesign/core/Token';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import { TextInput } from '@astryxdesign/core/TextInput';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Table, proportional, pixel, type TableColumn } from '@astryxdesign/core/Table';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { useToast } from '@astryxdesign/core/Toast';
import { apiClient } from '@/lib/api-client';
import { NurseAssessmentForm, type NurseAssessmentRegistration } from './NurseAssessmentForm';

export interface RegistrationItem extends NurseAssessmentRegistration, Record<string, unknown> {
  insurance_type: 'GENERAL' | 'BPJS';
  registration_date: string;
  status:
    | 'WAITING_NURSE'
    | 'IN_NURSE'
    | 'WAITING_DOCTOR'
    | 'IN_DOCTOR'
    | 'PHARMACY'
    | 'BILLING'
    | 'COMPLETED'
    | 'CANCELLED';
}

type QueueStatusFilter = 'ALL' | 'WAITING_NURSE' | 'IN_NURSE';

export const NurseQueueList: React.FC = () => {
  const showToast = useToast();

  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePatient, setActivePatient] = useState<RegistrationItem | null>(null);
  const [callingId, setCallingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<QueueStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [completedBanner, setCompletedBanner] = useState<string | null>(null);

  const fetchTriageRegistrations = useCallback(async () => {
    const res = await apiClient<{ success: boolean; data: RegistrationItem[] }>(
      '/registrations'
    );
    return (Array.isArray(res.data) ? res.data : []).filter(
      (r) => r.status === 'WAITING_NURSE' || r.status === 'IN_NURSE'
    );
  }, []);

  const loadTriageQueue = useCallback(
    async (notifyUser = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const triageList = await fetchTriageRegistrations();
        setRegistrations(triageList);
        if (notifyUser) {
          showToast({
            body: `Antrean diperbarui (${triageList.length} pasien aktif).`,
            uniqueID: 'triage-queue-refresh',
          });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Gagal memuat antrean triage keperawatan.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [fetchTriageRegistrations, showToast]
  );

  useEffect(() => {
    let isCancelled = false;
    fetchTriageRegistrations()
      .then((triageList) => {
        if (!isCancelled) {
          setRegistrations(triageList);
          setError(null);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : 'Gagal memuat antrean triage keperawatan.'
          );
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [fetchTriageRegistrations]);

  const handleStartAssessment = useCallback(
    async (item: RegistrationItem) => {
      setCallingId(item.id);
      setCompletedBanner(null);

      try {
        if (item.status === 'WAITING_NURSE') {
          try {
            await apiClient(`/registrations/${item.id}/status`, {
              method: 'PATCH',
              body: JSON.stringify({ status: 'IN_NURSE' }),
            });
          } catch {
            // Tetap buka lembar skrining bila update status antrean minor gagal
          }
          showToast({
            body: `Memanggil ${item.queue_number} — ${item.patient?.name || 'Pasien'}.`,
            uniqueID: 'triage-call-patient',
          });
        }

        setActivePatient({
          ...item,
          status: 'IN_NURSE',
        });
      } finally {
        setCallingId(null);
      }
    },
    [showToast]
  );

  const filteredRegistrations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return registrations.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      if (!normalizedQuery) return true;
      const patientName = (item.patient?.name || '').toLowerCase();
      const rmNumber = (item.patient?.medical_record_number || '').toLowerCase();
      const queueNo = (item.queue_number || '').toLowerCase();
      const polyName = (item.polyclinic?.name || '').toLowerCase();
      return (
        patientName.includes(normalizedQuery) ||
        rmNumber.includes(normalizedQuery) ||
        queueNo.includes(normalizedQuery) ||
        polyName.includes(normalizedQuery)
      );
    });
  }, [registrations, statusFilter, searchQuery]);

  const waitingCount = useMemo(
    () => registrations.filter((r) => r.status === 'WAITING_NURSE').length,
    [registrations]
  );
  const inNurseCount = useMemo(
    () => registrations.filter((r) => r.status === 'IN_NURSE').length,
    [registrations]
  );

  const firstWaitingId = useMemo(
    () => filteredRegistrations.find((r) => r.status === 'WAITING_NURSE')?.id ?? null,
    [filteredRegistrations]
  );
  const hasAnyInNurse = inNurseCount > 0;
  const hasActiveFilter = statusFilter !== 'ALL' || searchQuery.trim().length > 0;

  const columns: TableColumn<RegistrationItem>[] = useMemo(
    () => [
      {
        key: 'queue_number',
        header: 'Antrean',
        width: pixel(110),
        renderCell: (item) => <Code>{item.queue_number}</Code>,
      },
      {
        key: 'patient',
        header: 'Pasien',
        width: proportional(2, { minWidth: 200 }),
        renderCell: (item) => (
          <VStack gap={0.5}>
            <Text weight="semibold">{item.patient?.name || 'Pasien Tanpa Nama'}</Text>
            <HStack gap={1.5} align="center" wrap="wrap">
              <Code color="secondary">{item.patient?.medical_record_number || '-'}</Code>
              <Token
                size="sm"
                color={item.insurance_type === 'BPJS' ? 'green' : 'gray'}
                label={item.insurance_type === 'BPJS' ? 'BPJS' : 'Umum'}
              />
            </HStack>
          </VStack>
        ),
      },
      {
        key: 'polyclinic',
        header: 'Poliklinik Tujuan',
        width: proportional(1.5, { minWidth: 180 }),
        renderCell: (item) => (
          <VStack gap={0.5}>
            <Text>{item.polyclinic?.name || '-'}</Text>
            <Text color="secondary">{item.doctor?.name || '-'}</Text>
          </VStack>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: pixel(175),
        renderCell: (item) => {
          const isInNurse = item.status === 'IN_NURSE';
          const statusLabel = isInNurse ? 'Sedang Diperiksa' : 'Menunggu Dipanggil';
          return (
            <HStack gap={1.5} align="center">
              <StatusDot
                variant={isInNurse ? 'accent' : 'warning'}
                isPulsing={isInNurse}
                label={statusLabel}
              />
              <Text color="secondary">{statusLabel}</Text>
            </HStack>
          );
        },
      },
      {
        key: 'actions',
        header: 'Aksi',
        width: pixel(175),
        align: 'end',
        renderCell: (item) => {
          const isInNurse = item.status === 'IN_NURSE';
          const isRecommendedNext = !hasAnyInNurse && item.id === firstWaitingId;
          const label = isInNurse
            ? 'Lanjutkan'
            : isRecommendedNext
              ? 'Panggil Berikutnya'
              : 'Panggil';

          return (
            <Button
              variant={isInNurse || isRecommendedNext ? 'primary' : 'secondary'}
              size="sm"
              icon={<Icon icon="chevronRight" />}
              label={label}
              isLoading={callingId === item.id}
              isDisabled={callingId !== null && callingId !== item.id}
              onClick={() => handleStartAssessment(item)}
            />
          );
        },
      },
    ],
    [callingId, firstWaitingId, handleStartAssessment, hasAnyInNurse]
  );

  if (activePatient) {
    return (
      <NurseAssessmentForm
        registration={activePatient}
        onComplete={() => {
          const finishedName = activePatient.patient?.name || activePatient.queue_number;
          setActivePatient(null);
          setCompletedBanner(
            `Skrining ${finishedName} disimpan dan diteruskan ke antrean dokter.`
          );
          loadTriageQueue(false);
        }}
        onCancel={() => setActivePatient(null)}
      />
    );
  }

  return (
    <VStack gap={4}>
      <HStack justify="between" align="center" wrap="wrap" gap={3}>
        <HStack gap={2} align="center" wrap="wrap">
          <Heading level={1}>Antrean Triage</Heading>
          <Badge variant="teal" label={registrations.length} />
        </HStack>

        <Button
          variant="secondary"
          size="sm"
          label="Segarkan"
          isLoading={isLoading}
          onClick={() => loadTriageQueue(true)}
        />
      </HStack>

      {completedBanner ? (
        <Banner
          status="success"
          title="Diteruskan ke Dokter"
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
              onClick={() => loadTriageQueue(true)}
            />
          }
        />
      ) : null}

      <Card padding={0} elevation="low">
        <Section variant="transparent" padding={3} dividers={['bottom']}>
          <HStack justify="between" align="center" wrap="wrap" gap={3}>
            <SegmentedControl
              label="Filter Status Antrean"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val as QueueStatusFilter)}
              size="sm"
            >
              <SegmentedControlItem
                value="ALL"
                label={`Semua (${registrations.length})`}
              />
              <SegmentedControlItem
                value="WAITING_NURSE"
                label={`Menunggu (${waitingCount})`}
              />
              <SegmentedControlItem
                value="IN_NURSE"
                label={`Diperiksa (${inNurseCount})`}
              />
            </SegmentedControl>

            <TextInput
              label="Cari Pasien di Antrean"
              isLabelHidden
              type="search"
              size="sm"
              width={260}
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              placeholder="Cari antrean, nama, atau No. RM..."
              startIcon="search"
              hasClear
            />
          </HStack>
        </Section>

        {isLoading ? (
          <VStack gap={2} padding={4}>
            <Skeleton height={36} radius={2} index={0} />
            <Skeleton height={44} radius={2} index={1} />
            <Skeleton height={44} radius={2} index={2} />
            <Skeleton height={44} radius={2} index={3} />
          </VStack>
        ) : (
          <Table
            data={filteredRegistrations}
            columns={columns}
            idKey="id"
            hasHover
            density="balanced"
            emptyState={
              <EmptyState
                headingLevel={2}
                icon={<Icon icon="info" size="lg" color="teal" />}
                title={
                  hasActiveFilter
                    ? 'Tidak Ada Pasien Sesuai Filter'
                    : 'Antrean Triage Kosong'
                }
                description={
                  hasActiveFilter
                    ? 'Ubah filter status atau kata kunci pencarian.'
                    : 'Pasien yang telah mendaftar di loket akan tampil di sini.'
                }
                actions={
                  hasActiveFilter ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      label="Reset Filter"
                      onClick={() => {
                        setStatusFilter('ALL');
                        setSearchQuery('');
                      }}
                    />
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      label="Segarkan"
                      onClick={() => loadTriageQueue(true)}
                    />
                  )
                }
              />
            }
          />
        )}
      </Card>
    </VStack>
  );
};
