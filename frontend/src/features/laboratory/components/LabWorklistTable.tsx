import React, { useState, useMemo } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Section } from '@astryxdesign/core/Section';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { Token } from '@astryxdesign/core/Token';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@astryxdesign/core/Table';
import { TextInput } from '@astryxdesign/core/TextInput';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { HStack, VStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Code } from '@astryxdesign/core/Code';
import { Icon } from '@astryxdesign/core/Icon';
import type { LabOrderDetail, LabOrderStatus } from './LabResultModal';

export type LabFilterStatus = 'ALL' | LabOrderStatus;

export interface LabWorklistTableProps {
  orders: LabOrderDetail[];
  isLoading: boolean;
  onOpenResultModal: (order: LabOrderDetail) => void;
  onRefresh?: () => void;
  statusFilter?: LabFilterStatus;
  onStatusFilterChange?: (status: LabFilterStatus) => void;
  searchTerm?: string;
  onSearchChange?: (search: string) => void;
  onStartProcessing?: (order: LabOrderDetail) => void;
  processingOrderId?: number | null;
  canManageResults?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

function getOrderStatusDisplay(status: LabOrderStatus): {
  dotVariant: 'warning' | 'accent' | 'success' | 'neutral';
  label: string;
} {
  switch (status) {
    case 'REQUESTED':
      return { dotVariant: 'warning', label: 'Menunggu Sampel' };
    case 'IN_PROGRESS':
      return { dotVariant: 'accent', label: 'Sedang Diuji' };
    case 'COMPLETED':
      return { dotVariant: 'success', label: 'Selesai' };
    case 'CANCELLED':
      return { dotVariant: 'neutral', label: 'Dibatalkan' };
  }
}

export const LabWorklistTable: React.FC<LabWorklistTableProps> = ({
  orders,
  isLoading,
  onOpenResultModal,
  onRefresh,
  statusFilter: controlledStatusFilter,
  onStatusFilterChange,
  searchTerm: controlledSearchTerm,
  onSearchChange,
  onStartProcessing,
  processingOrderId = null,
  canManageResults = true,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [internalStatusFilter, setInternalStatusFilter] =
    useState<LabFilterStatus>('ALL');

  const searchTerm =
    controlledSearchTerm !== undefined ? controlledSearchTerm : internalSearchTerm;
  const statusFilter =
    controlledStatusFilter !== undefined
      ? controlledStatusFilter
      : internalStatusFilter;

  const handleSearchChange = (val: string) => {
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearchTerm(val);
    }
  };

  const handleStatusChange = (val: string) => {
    const nextStatus = val as LabFilterStatus;
    if (onStatusFilterChange) {
      onStatusFilterChange(nextStatus);
    } else {
      setInternalStatusFilter(nextStatus);
    }
  };

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        order.order_number.toLowerCase().includes(q) ||
        order.patient_name.toLowerCase().includes(q) ||
        order.medical_record_number.toLowerCase().includes(q) ||
        order.doctor_name.toLowerCase().includes(q)
      );
    });
  }, [orders, searchTerm, statusFilter]);

  const hasActiveFilter = statusFilter !== 'ALL' || searchTerm.trim().length > 0;

  return (
    <Card elevation="low" padding={0}>
      <Section variant="transparent" padding={3} dividers={['bottom']}>
        <HStack justify="between" align="center" wrap="wrap" gap={3}>
          <SegmentedControl
            label="Filter Status Order Laboratorium"
            value={statusFilter}
            onChange={handleStatusChange}
            size="sm"
          >
            <SegmentedControlItem value="ALL" label="Semua" />
            <SegmentedControlItem value="REQUESTED" label="Menunggu" />
            <SegmentedControlItem value="IN_PROGRESS" label="Diuji" />
            <SegmentedControlItem value="COMPLETED" label="Selesai" />
            <SegmentedControlItem value="CANCELLED" label="Batal" />
          </SegmentedControl>

          <HStack gap={2} align="center" wrap="wrap">
            <TextInput
              label="Cari Order Laboratorium"
              isLabelHidden
              type="search"
              size="sm"
              width={260}
              placeholder="Cari no. order, nama, No. RM, dokter..."
              startIcon="search"
              hasClear
              value={searchTerm}
              onChange={handleSearchChange}
            />

            {onRefresh ? (
              <Button
                variant="secondary"
                size="sm"
                label="Segarkan"
                onClick={onRefresh}
                isDisabled={isLoading}
              />
            ) : null}
          </HStack>
        </HStack>
      </Section>

      {isLoading ? (
        <VStack gap={2} padding={4}>
          <Skeleton height={36} radius={2} index={0} />
          <Skeleton height={48} radius={2} index={1} />
          <Skeleton height={48} radius={2} index={2} />
          <Skeleton height={48} radius={2} index={3} />
        </VStack>
      ) : filteredOrders.length === 0 ? (
        <Section variant="transparent" padding={6}>
          <EmptyState
            headingLevel={2}
            icon={<Icon icon="info" size="lg" color="teal" />}
            title={
              hasActiveFilter
                ? 'Tidak Ada Order Sesuai Filter'
                : 'Belum Ada Antrean Laboratorium'
            }
            description={
              hasActiveFilter
                ? 'Ubah filter status atau kata kunci pencarian.'
                : 'Permintaan pemeriksaan laboratorium dari dokter akan tampil di sini.'
            }
            actions={
              hasActiveFilter ? (
                <Button
                  variant="secondary"
                  size="sm"
                  label="Reset Filter"
                  onClick={() => {
                    handleStatusChange('ALL');
                    handleSearchChange('');
                  }}
                />
              ) : undefined
            }
          />
        </Section>
      ) : (
        <VStack gap={0}>
          <Table density="balanced" dividers="rows" hasHover>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>No. Order</TableHeaderCell>
                <TableHeaderCell>Pasien</TableHeaderCell>
                <TableHeaderCell>Dokter & Poli</TableHeaderCell>
                <TableHeaderCell>Parameter Uji</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell style={{ textAlign: 'right' }}>Aksi</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const statusDisplay = getOrderStatusDisplay(order.status);
                const abnormalItems = order.items.filter(
                  (i) => i.status_flag && i.status_flag !== 'NORMAL'
                );
                const isReadOnlyOrder =
                  order.status === 'COMPLETED' ||
                  order.status === 'CANCELLED' ||
                  !canManageResults;

                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Code>{order.order_number}</Code>
                    </TableCell>
                    <TableCell>
                      <VStack gap={0.5}>
                        <Text weight="semibold">{order.patient_name}</Text>
                        <HStack gap={1.5} align="center" wrap="wrap">
                          <Code color="secondary">{order.medical_record_number}</Code>
                          {order.patient_nik_masked ? (
                            <Text type="supporting">{order.patient_nik_masked}</Text>
                          ) : null}
                        </HStack>
                      </VStack>
                    </TableCell>
                    <TableCell>
                      <VStack gap={0.5}>
                        <Text>{order.doctor_name}</Text>
                        <Text color="secondary">{order.polyclinic_name}</Text>
                      </VStack>
                    </TableCell>
                    <TableCell>
                      <VStack gap={1}>
                        {order.items.map((i) => {
                          const isFlagged = i.status_flag && i.status_flag !== 'NORMAL';
                          return (
                            <HStack key={i.id} gap={1.5} align="center" wrap="wrap">
                              <Text>{i.test_name}</Text>
                              {isFlagged ? (
                                <Badge variant="error" label={i.status_flag!} />
                              ) : null}
                            </HStack>
                          );
                        })}
                      </VStack>
                    </TableCell>
                    <TableCell>
                      <VStack gap={1}>
                        <HStack gap={1.5} align="center">
                          <StatusDot
                            variant={statusDisplay.dotVariant}
                            isPulsing={order.status === 'IN_PROGRESS'}
                            label={statusDisplay.label}
                          />
                          <Text color="secondary">{statusDisplay.label}</Text>
                        </HStack>
                        {abnormalItems.length > 0 ? (
                          <Token
                            size="sm"
                            color="red"
                            icon={<Icon icon="warning" size="xsm" />}
                            label={`${abnormalItems.length} Nilai Abnormal`}
                          />
                        ) : null}
                      </VStack>
                    </TableCell>
                    <TableCell>
                      <HStack gap={1.5} justify="end" align="center">
                        {canManageResults &&
                        order.status === 'REQUESTED' &&
                        onStartProcessing ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            label="Proses"
                            isLoading={processingOrderId === order.id}
                            isDisabled={
                              processingOrderId !== null &&
                              processingOrderId !== order.id
                            }
                            onClick={() => onStartProcessing(order)}
                          />
                        ) : null}
                        <Button
                          variant={isReadOnlyOrder ? 'secondary' : 'primary'}
                          size="sm"
                          label={isReadOnlyOrder ? 'Lihat Hasil' : 'Input Hasil'}
                          onClick={() => onOpenResultModal(order)}
                        />
                      </HStack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {hasMore && onLoadMore ? (
            <Section variant="transparent" padding={3} dividers={['top']}>
              <HStack justify="center">
                <Button
                  variant="secondary"
                  size="sm"
                  label="Muat Lebih Banyak"
                  isLoading={isLoadingMore}
                  isDisabled={isLoadingMore}
                  onClick={onLoadMore}
                />
              </HStack>
            </Section>
          ) : null}
        </VStack>
      )}
    </Card>
  );
};
