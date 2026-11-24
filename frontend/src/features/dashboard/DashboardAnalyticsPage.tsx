import React, { useState, useEffect, useCallback } from 'react';
import { KpiMetricsRow } from './components/KpiMetricsRow';
import { VisitsByPolyChart } from './components/VisitsByPolyChart';
import type { PolyclinicStat } from './components/VisitsByPolyChart';
import { RevenueSummaryCard } from './components/RevenueSummaryCard';
import { TopMedicinesTable } from './components/TopMedicinesTable';
import type { TopMedicineItem } from './components/TopMedicinesTable';
import { Button } from '../../components/ui';

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
    <div className="space-y-6">
      {/* Page Header & Period Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">
            Dashboard Operasional & Eksekutif SIMRS
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Ringkasan performa kunjungan rawat jalan, utilisasi poliklinik, pendapatan kas, dan farmasi
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-border-default text-xs font-semibold">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              period === 'today' ? 'bg-white shadow text-primary font-bold' : 'text-text-muted hover:text-text-main'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              period === 'week' ? 'bg-white shadow text-primary font-bold' : 'text-text-muted hover:text-text-main'
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              period === 'month' ? 'bg-white shadow text-primary font-bold' : 'text-text-muted hover:text-text-main'
            }`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              period === 'all' ? 'bg-white shadow text-primary font-bold' : 'text-text-muted hover:text-text-main'
            }`}
          >
            Semua Waktu
          </button>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between"
        >
          <span>{errorMessage}</span>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            Coba Lagi
          </Button>
        </div>
      )}

      {/* KPI Metrics Summary Row */}
      <KpiMetricsRow data={data} isLoading={isLoading} />

      {/* Two Column Layout for Charts & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    </div>
  );
};
