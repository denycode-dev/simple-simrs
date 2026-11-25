import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Code } from '@astryxdesign/core/Code';
import { Badge } from '@astryxdesign/core/Badge';
import { Token } from '@astryxdesign/core/Token';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Section } from '@astryxdesign/core/Section';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
} from '@astryxdesign/core/Table';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { ENV } from '@/config/env';
import { apiClient } from '@/lib/api-client';
import { KpiMetricsRow } from './components/KpiMetricsRow';
import { VisitsByPolyChart, type PolyclinicStat } from './components/VisitsByPolyChart';
import { RevenueSummaryCard } from './components/RevenueSummaryCard';
import { TopMedicinesTable, type TopMedicineItem } from './components/TopMedicinesTable';

export interface AnalyticsSummaryResponse {
  visits: {
    total_visits: number;
    general_visits: number;
    bpjs_visits: number;
    completed_visits: number;
  };
  revenue: {
    total_revenue: string | number;
    general_revenue: string | number;
    bpjs_covered_revenue: string | number;
  };
  polyclinics: PolyclinicStat[];
  top_medicines: TopMedicineItem[];
}

interface QueueStatusResponse {
  total_active_queue: number;
  statuses: Array<{ status: string; count: number }>;
}

interface LabAnalyticsResponse {
  total_orders: number;
  requested_orders: number;
  in_progress_orders: number;
  completed_orders: number;
  total_test_items: number;
  abnormal_items: number;
  total_lab_tariff: number;
}

interface PharmacyAnalyticsResponse {
  total_active_medicines: number;
  low_stock_count: number;
  out_of_stock_count: number;
  pending_prescriptions: number;
  dispensed_prescriptions: number;
  low_stock_medicines: Array<{
    id: number;
    code: string;
    name: string;
    unit: string;
    stock: number;
    min_stock: number;
  }>;
}

type AnalyticsPeriod = 'today' | 'week' | 'month' | 'all';

function buildDateParams(period: AnalyticsPeriod): {
  start_date?: string;
  end_date?: string;
} {
  if (period === 'all') return {};
  const now = new Date();
  const endDate = now.toISOString().split('T')[0];

  if (period === 'today') {
    return { start_date: endDate, end_date: endDate };
  }
  if (period === 'week') {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      start_date: sevenDaysAgo.toISOString().split('T')[0],
      end_date: endDate,
    };
  }
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    start_date: firstDayOfMonth.toISOString().split('T')[0],
    end_date: endDate,
  };
}

export const DashboardAnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('all');
  const [data, setData] = useState<AnalyticsSummaryResponse | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStatusResponse | null>(null);
  const [labStats, setLabStats] = useState<LabAnalyticsResponse | null>(null);
  const [pharmacyStats, setPharmacyStats] = useState<PharmacyAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnitDetailOpen, setIsUnitDetailOpen] = useState<boolean>(false);

  const fetchAllAnalytics = useCallback(async () => {
    const params = buildDateParams(period);
    const [summaryRes, queueRes, labRes, pharmacyRes] = await Promise.all([
      apiClient<{ success: boolean; data: AnalyticsSummaryResponse }>(
        `${ENV.ANCILLARY_BASE_URL}/analytics/summary`,
        { params }
      ),
      apiClient<{ success: boolean; data: QueueStatusResponse }>(
        `${ENV.ANCILLARY_BASE_URL}/analytics/queue-status`,
        { params }
      ).catch(() => null),
      apiClient<{ success: boolean; data: LabAnalyticsResponse }>(
        `${ENV.ANCILLARY_BASE_URL}/analytics/laboratory`,
        { params }
      ).catch(() => null),
      apiClient<{ success: boolean; data: PharmacyAnalyticsResponse }>(
        `${ENV.ANCILLARY_BASE_URL}/analytics/pharmacy`,
        { params }
      ).catch(() => null),
    ]);

    return {
      summary: summaryRes?.success && summaryRes.data ? summaryRes.data : null,
      queue: queueRes?.success && queueRes.data ? queueRes.data : null,
      lab: labRes?.success && labRes.data ? labRes.data : null,
      pharmacy: pharmacyRes?.success && pharmacyRes.data ? pharmacyRes.data : null,
    };
  }, [period]);

  const reloadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await fetchAllAnalytics();
      setData(result.summary);
      setQueueStats(result.queue);
      setLabStats(result.lab);
      setPharmacyStats(result.pharmacy);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Gagal memuat analitik operasional SIMRS.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [fetchAllAnalytics]);

  useEffect(() => {
    let cancelled = false;
    fetchAllAnalytics()
      .then((result) => {
        if (!cancelled) {
          setData(result.summary);
          setQueueStats(result.queue);
          setLabStats(result.lab);
          setPharmacyStats(result.pharmacy);
          setErrorMessage(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : 'Gagal memuat analitik operasional SIMRS.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchAllAnalytics]);

  const hasUnitDetail = Boolean(queueStats || labStats || pharmacyStats);
  const lowStockCount =
    (pharmacyStats?.low_stock_count ?? 0) + (pharmacyStats?.out_of_stock_count ?? 0);

  const periodLabel = useMemo(() => {
    switch (period) {
      case 'today':
        return 'Hari Ini';
      case 'week':
        return '7 Hari Terakhir';
      case 'month':
        return 'Bulan Ini';
      case 'all':
        return 'Semua Waktu';
    }
  }, [period]);

  return (
    <VStack gap={4}>
      <HStack justify="between" align="center" wrap="wrap" gap={3}>
        <Heading level={1}>Dashboard & Analitik</Heading>

        <HStack gap={2} align="center" wrap="wrap">
          <SegmentedControl
            value={period}
            onChange={(val) => {
              setIsLoading(true);
              setPeriod(val as AnalyticsPeriod);
            }}
            label="Filter Periode Analitik"
            size="sm"
          >
            <SegmentedControlItem value="today" label="Hari Ini" />
            <SegmentedControlItem value="week" label="7 Hari" />
            <SegmentedControlItem value="month" label="Bulan Ini" />
            <SegmentedControlItem value="all" label="Semua" />
          </SegmentedControl>

          {hasUnitDetail ? (
            <Button
              variant="secondary"
              size="sm"
              label="Detail Unit"
              endContent={
                lowStockCount > 0 ? (
                  <Badge variant="warning" label={lowStockCount} />
                ) : undefined
              }
              onClick={() => setIsUnitDetailOpen(true)}
            />
          ) : null}

          <Button
            variant="secondary"
            size="sm"
            label="Segarkan"
            isLoading={isLoading}
            onClick={reloadAnalytics}
          />
        </HStack>
      </HStack>

      {errorMessage ? (
        <Banner
          status="error"
          title="Gagal Memuat Analitik"
          description={errorMessage}
          collapsible={false}
          endContent={
            <Button
              variant="secondary"
              size="sm"
              label="Coba Lagi"
              onClick={reloadAnalytics}
            />
          }
        />
      ) : null}

      <KpiMetricsRow data={data} isLoading={isLoading} />

      <Grid columns={{ minWidth: 320, max: 2 }} gap={4}>
        <VisitsByPolyChart data={data?.polyclinics || []} isLoading={isLoading} />
        <RevenueSummaryCard
          data={
            data?.revenue || {
              total_revenue: 0,
              general_revenue: 0,
              bpjs_covered_revenue: 0,
            }
          }
          isLoading={isLoading}
        />
      </Grid>

      <TopMedicinesTable data={data?.top_medicines || []} isLoading={isLoading} />

      {isUnitDetailOpen ? (
        <Dialog
          isOpen={true}
          onOpenChange={(open) => {
            if (!open) setIsUnitDetailOpen(false);
          }}
          width={760}
          maxHeight="85dvh"
          padding={0}
          purpose="info"
        >
          <Layout
            height="fill"
            padding={5}
            defaultHasDividers
            header={
              <DialogHeader
                title="Ringkasan Unit Antrean, Lab & Farmasi"
                subtitle={`Periode: ${periodLabel}`}
                onOpenChange={() => setIsUnitDetailOpen(false)}
              />
            }
            content={
              <LayoutContent isScrollable>
                <VStack gap={4}>
                  {queueStats ? (
                    <Section variant="muted" padding={3}>
                      <VStack gap={2}>
                        <HStack justify="between" align="center">
                          <Heading level={3}>Status Antrean Rawat Jalan</Heading>
                          <Token
                            size="sm"
                            color="teal"
                            label={`${queueStats.total_active_queue} Aktif`}
                          />
                        </HStack>
                        <MetadataList columns="multi">
                          {queueStats.statuses.map((st) => (
                            <MetadataListItem key={st.status} label={st.status}>
                              <Code>{st.count}</Code>
                            </MetadataListItem>
                          ))}
                        </MetadataList>
                      </VStack>
                    </Section>
                  ) : null}

                  {labStats ? (
                    <Section variant="muted" padding={3}>
                      <VStack gap={2}>
                        <Heading level={3}>Beban Uji Laboratorium</Heading>
                        <MetadataList columns="multi">
                          <MetadataListItem label="Total Order">
                            <Code>{labStats.total_orders}</Code>
                          </MetadataListItem>
                          <MetadataListItem label="Selesai">
                            <Code>{labStats.completed_orders}</Code>
                          </MetadataListItem>
                          <MetadataListItem label="Total Parameter">
                            <Code>{labStats.total_test_items}</Code>
                          </MetadataListItem>
                          <MetadataListItem label="Hasil Abnormal">
                            <Token
                              size="sm"
                              color={labStats.abnormal_items > 0 ? 'red' : 'green'}
                              label={String(labStats.abnormal_items)}
                            />
                          </MetadataListItem>
                        </MetadataList>
                      </VStack>
                    </Section>
                  ) : null}

                  {pharmacyStats ? (
                    <VStack gap={2}>
                      <HStack justify="between" align="center" wrap="wrap" gap={2}>
                        <Heading level={3}>Stok Kritis Farmasi</Heading>
                        <HStack gap={1.5}>
                          <Token
                            size="sm"
                            color="orange"
                            label={`Menipis: ${pharmacyStats.low_stock_count}`}
                          />
                          <Token
                            size="sm"
                            color="red"
                            label={`Habis: ${pharmacyStats.out_of_stock_count}`}
                          />
                        </HStack>
                      </HStack>

                      {pharmacyStats.low_stock_medicines.length === 0 ? (
                        <Text color="secondary">
                          Seluruh stok obat berada di atas batas minimum.
                        </Text>
                      ) : (
                        <Table density="compact" dividers="rows">
                          <TableHeader>
                            <TableRow>
                              <TableHeaderCell>Kode</TableHeaderCell>
                              <TableHeaderCell>Nama Obat</TableHeaderCell>
                              <TableHeaderCell style={{ textAlign: 'right' }}>
                                Sisa / Min
                              </TableHeaderCell>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pharmacyStats.low_stock_medicines.map((med) => (
                              <TableRow key={med.id}>
                                <TableCell>
                                  <Code color="secondary">{med.code}</Code>
                                </TableCell>
                                <TableCell>
                                  <Text weight="medium">{med.name}</Text>
                                </TableCell>
                                <TableCell>
                                  <HStack justify="end">
                                    <Token
                                      size="sm"
                                      color={med.stock === 0 ? 'red' : 'orange'}
                                      label={`${med.stock} / ${med.min_stock} ${med.unit}`}
                                    />
                                  </HStack>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </VStack>
                  ) : null}
                </VStack>
              </LayoutContent>
            }
            footer={
              <LayoutFooter>
                <HStack justify="end">
                  <Button
                    variant="secondary"
                    size="md"
                    label="Tutup"
                    onClick={() => setIsUnitDetailOpen(false)}
                  />
                </HStack>
              </LayoutFooter>
            }
          />
        </Dialog>
      ) : null}
    </VStack>
  );
};
