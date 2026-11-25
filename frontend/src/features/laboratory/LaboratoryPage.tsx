import React, { useState, useEffect, useCallback } from 'react';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { useToast } from '@astryxdesign/core/Toast';
import { ENV } from '@/config/env';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/features/auth';
import { LabWorklistTable, type LabFilterStatus } from './components/LabWorklistTable';
import { LabResultModal, type LabOrderDetail } from './components/LabResultModal';
import { LabOrderModal } from './components/LabOrderModal';

interface LabOrdersResponse {
  success: boolean;
  message: string;
  data: LabOrderDetail[];
  meta?: {
    limit: number;
    count: number;
    next_cursor: number | null;
  };
}

export const LaboratoryPage: React.FC = () => {
  const showToast = useToast();
  const { user } = useAuth();

  const canCreateOrder =
    !user || user.role === 'admin' || user.role === 'doctor' || user.role === 'lab';
  const canManageResults = !user || user.role === 'admin' || user.role === 'lab';

  const [orders, setOrders] = useState<LabOrderDetail[]>([]);
  const [statusFilter, setStatusFilter] = useState<LabFilterStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedOrderForResult, setSelectedOrderForResult] =
    useState<LabOrderDetail | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);

  const fetchOrders = useCallback(
    async (cursor?: number) => {
      const isPagination = cursor !== undefined;
      if (isPagination) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setErrorMessage(null);
      }

      try {
        const res = await apiClient<LabOrdersResponse>(
          `${ENV.ANCILLARY_BASE_URL}/laboratory/orders`,
          {
            params: {
              status: statusFilter,
              search: searchTerm.trim() || undefined,
              cursor,
              limit: 20,
            },
          }
        );

        const list = Array.isArray(res.data) ? res.data : [];
        if (isPagination) {
          setOrders((prev) => [...prev, ...list]);
        } else {
          setOrders(list);
        }
        setNextCursor(res.meta?.next_cursor ?? null);
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Gagal memuat data permintaan laboratorium.'
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [searchTerm, statusFilter]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const handleStartProcessing = async (order: LabOrderDetail) => {
    setProcessingOrderId(order.id);
    setErrorMessage(null);
    try {
      await apiClient(`${ENV.ANCILLARY_BASE_URL}/laboratory/orders/${order.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          notes: 'Sampel telah diambil dan sedang diproses',
        }),
      });
      showToast({
        body: `Order ${order.order_number} kini berstatus Sedang Diuji.`,
        uniqueID: 'lab-status-in-progress',
      });
      await fetchOrders();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Gagal memperbarui status order laboratorium.'
      );
    } finally {
      setProcessingOrderId(null);
    }
  };

  return (
    <VStack gap={4}>
      <HStack justify="between" align="center" wrap="wrap" gap={3}>
        <HStack gap={2} align="center" wrap="wrap">
          <Heading level={1}>Laboratorium Klinis</Heading>
          <Badge variant="teal" label={orders.length} />
        </HStack>

        {canCreateOrder ? (
          <Button
            variant="primary"
            size="md"
            label="+ Buat Permintaan Lab"
            onClick={() => setIsOrderModalOpen(true)}
          />
        ) : null}
      </HStack>

      {errorMessage ? (
        <Banner
          status="error"
          title="Gagal Memuat Data Laboratorium"
          description={errorMessage}
          collapsible={false}
          endContent={
            <Button
              variant="secondary"
              size="sm"
              label="Coba Lagi"
              onClick={() => fetchOrders()}
            />
          }
        />
      ) : null}

      <LabWorklistTable
        orders={orders}
        isLoading={isLoading}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenResultModal={(order) => setSelectedOrderForResult(order)}
        onStartProcessing={handleStartProcessing}
        processingOrderId={processingOrderId}
        canManageResults={canManageResults}
        onRefresh={() => fetchOrders()}
        hasMore={nextCursor !== null}
        isLoadingMore={isLoadingMore}
        onLoadMore={() => {
          if (nextCursor !== null) {
            fetchOrders(nextCursor);
          }
        }}
      />

      <LabResultModal
        isOpen={Boolean(selectedOrderForResult)}
        onClose={() => setSelectedOrderForResult(null)}
        order={selectedOrderForResult}
        onSuccess={() => {
          showToast({
            body: 'Data pemeriksaan laboratorium berhasil diperbarui.',
            uniqueID: 'lab-result-saved',
          });
          fetchOrders();
        }}
      />

      <LabOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSuccess={() => {
          showToast({
            body: 'Permintaan uji laboratorium berhasil dikirim.',
            uniqueID: 'lab-order-created',
          });
          fetchOrders();
        }}
      />
    </VStack>
  );
};
