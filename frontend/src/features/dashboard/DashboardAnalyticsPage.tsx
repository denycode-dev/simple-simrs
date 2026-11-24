import React, { useState, useEffect, useCallback } from 'react';
import { KpiMetricsRow } from './components/KpiMetricsRow';
import { VisitsByPolyChart } from './components/VisitsByPolyChart';
import type { PolyclinicStat } from './components/VisitsByPolyChart';
import { RevenueSummaryCard } from './components/RevenueSummaryCard';
import { TopMedicinesTable } from './components/TopMedicinesTable';
import type { TopMedicineItem } from './components/TopMedicinesTable';
import { Button } from '@astryxdesign/core/Button';
import { Banner } from '@astryxdesign/core/Banner';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';

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

export const DashboardAnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [data, setData] = useState<AnalyticsSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let url = 'http://localhost:4000/api/v1/analytics/summary';
      const now = new Date();

      if (period === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        url += `?start_date=${todayStr}&end_date=${todayStr}`;
      } else if (period === 'week') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        url += `?start_date=${sevenDaysAgo.toISOString().split('T')[0]}&end_date=${now.toISOString().split('T')[0]}`;
      } else if (period === 'month') {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        url += `?start_date=${firstDayOfMonth.toISOString().split('T')[0]}&end_date=${now.toISOString().split('T')[0]}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setData(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat analitik operasional dari layanan Fastify.');
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <VStack gap={6} className="w-full">
      {/* Page Header & Period Filters */}
      <HStack justify="between" align="center" className="flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Operasional & Eksekutif SIMRS
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ringkasan performa kunjungan rawat jalan, utilisasi poliklinik, pendapatan kas, dan farmasi
          </p>
        </div>

        {/* Filter Segmented Control */}
        <SegmentedControl
          value={period}
          onChange={(val) => setPeriod(val as any)}
          label="Filter Periode Analitik"
          size="sm"
        >
          <SegmentedControlItem value="today" label="Hari Ini" />
          <SegmentedControlItem value="week" label="7 Hari Terakhir" />
          <SegmentedControlItem value="month" label="Bulan Ini" />
          <SegmentedControlItem value="all" label="Semua Waktu" />
        </SegmentedControl>
      </HStack>

      {errorMessage && (
        <Banner
          status="error"
          title="Koneksi Layanan Gagal"
          description={errorMessage}
          container="card"
        >
          <div className="pt-2">
            <Button variant="secondary" size="sm" label="Coba Lagi" onClick={fetchAnalytics} />
          </div>
        </Banner>
      )}

      {/* KPI Metrics Summary Row */}
      <KpiMetricsRow data={data} isLoading={isLoading} />

      {/* Two Column Layout for Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        <VisitsByPolyChart
          data={data?.polyclinics || []}
          isLoading={isLoading}
        />
        <RevenueSummaryCard
          data={data?.revenue || { total_revenue: 0, general_revenue: 0, bpjs_covered_revenue: 0 }}
          isLoading={isLoading}
        />
      </div>

      {/* Full Width Top Medicines */}
      <TopMedicinesTable
        data={data?.top_medicines || []}
        isLoading={isLoading}
      />
    </VStack>
  );
};
