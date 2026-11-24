import React from 'react';
import { Card, CardContent } from '../../../components/ui';
import { formatCurrency } from '../../../utils/formatters';

export interface KpiData {
  visits: {
    total_visits: number;
    general_visits: number;
    bpjs_visits: number;
    completed_visits: number;
  };
  revenue: {
    total_revenue: number | string;
    general_revenue: number | string;
    bpjs_covered_revenue: number | string;
  };
}

export interface KpiMetricsRowProps {
  data: KpiData | null;
  isLoading: boolean;
}

export const KpiMetricsRow: React.FC<KpiMetricsRowProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse bg-white border border-border-default p-4 h-28">
            <CardContent className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const visits = data.visits || {
    total_visits: 0,
    general_visits: 0,
    bpjs_visits: 0,
    completed_visits: 0,
  };

  const revenue = data.revenue || {
    total_revenue: 0,
    general_revenue: 0,
    bpjs_covered_revenue: 0,
  };

  const totalRev = Number(revenue.total_revenue) || 0;
  const generalRev = Number(revenue.general_revenue) || 0;
  const bpjsRev = Number(revenue.bpjs_covered_revenue) || 0;

  const completionRate =
    visits.total_visits > 0
      ? Math.round((visits.completed_visits / visits.total_visits) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Kunjungan */}
      <Card className="bg-white border border-border-default shadow-sm hover:border-primary/50 transition-colors">
        <CardContent className="p-4 space-y-1.5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Total Kunjungan Pasien
          </p>
          <div className="text-3xl font-extrabold text-text-main font-mono">
            {visits.total_visits}
          </div>
          <div className="text-xs text-text-muted flex items-center justify-between pt-1 border-t border-border-light">
            <span className="text-emerald-700 font-medium">{visits.bpjs_visits} Pasien BPJS</span>
            <span className="text-slate-600 font-medium">{visits.general_visits} Pasien Umum</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Total Pendapatan Pelayanan */}
      <Card className="bg-white border border-border-default shadow-sm hover:border-primary/50 transition-colors">
        <CardContent className="p-4 space-y-1.5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Total Pendapatan RS
          </p>
          <div className="text-2xl font-extrabold text-primary font-mono truncate">
            {formatCurrency(totalRev)}
          </div>
          <div className="text-xs text-text-muted flex items-center justify-between pt-1 border-t border-border-light">
            <span className="truncate">Tunai: {formatCurrency(generalRev)}</span>
            <span className="text-emerald-700 font-medium truncate">Klaim: {formatCurrency(bpjsRev)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Tingkat Penyelesaian Layanan */}
      <Card className="bg-white border border-border-default shadow-sm hover:border-primary/50 transition-colors">
        <CardContent className="p-4 space-y-1.5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Layanan Diselesaikan
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-text-main font-mono">
              {visits.completed_visits}
            </span>
            <span className="text-sm font-semibold text-emerald-600">
              ({completionRate}%)
            </span>
          </div>
          <div className="text-xs text-text-muted pt-1 border-t border-border-light">
            Dari total {visits.total_visits} kunjungan rawat jalan
          </div>
        </CardContent>
      </Card>

      {/* 4. Rasio Penjamin Pasien */}
      <Card className="bg-white border border-border-default shadow-sm hover:border-primary/50 transition-colors">
        <CardContent className="p-4 space-y-1.5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Dominasi Penjamin
          </p>
          <div className="text-xl font-bold text-text-main truncate">
            {visits.bpjs_visits >= visits.general_visits ? 'Peserta BPJS' : 'Pasien Umum'}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full"
              style={{
                width: visits.total_visits > 0 ? `${(visits.bpjs_visits / visits.total_visits) * 100}%` : '50%',
              }}
              title="Porsi BPJS"
            ></div>
            <div
              className="bg-primary h-full"
              style={{
                width: visits.total_visits > 0 ? `${(visits.general_visits / visits.total_visits) * 100}%` : '50%',
              }}
              title="Porsi Umum"
            ></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
