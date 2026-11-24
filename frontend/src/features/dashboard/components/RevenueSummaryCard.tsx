import React from 'react';
import { Card, CardHeader, CardContent } from '../../../components/ui';
import { formatCurrency } from '../../../utils/formatters';

export interface RevenueData {
  total_revenue: number | string;
  general_revenue: number | string;
  bpjs_covered_revenue: number | string;
}

export interface RevenueSummaryCardProps {
  data: RevenueData;
  isLoading: boolean;
}

export const RevenueSummaryCard: React.FC<RevenueSummaryCardProps> = ({ data, isLoading }) => {
  const total = Number(data?.total_revenue) || 0;
  const general = Number(data?.general_revenue) || 0;
  const bpjs = Number(data?.bpjs_covered_revenue) || 0;

  const generalPct = total > 0 ? Math.round((general / total) * 100) : 0;
  const bpjsPct = total > 0 ? Math.round((bpjs / total) * 100) : 0;

  return (
    <Card className="w-full bg-white border border-border-default shadow-sm">
      <CardHeader className="border-b border-border-default pb-3">
        <h3 className="text-base font-bold text-text-main">
          Komposisi Sumber Pendapatan
        </h3>
        <p className="text-xs text-text-muted">
          Penerimaan tunai (out-of-pocket) vs Klaim penjamin BPJS
        </p>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-text-muted">Memuat data pendapatan...</div>
        ) : (
          <>
            <div className="p-3 bg-slate-50 border border-border-light rounded-lg">
              <span className="text-xs text-text-muted font-medium">Total Akumulasi Tagihan:</span>
              <div className="text-xl font-bold font-mono text-primary mt-0.5">
                {formatCurrency(total)}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800">Kas Tunai Pasien Umum</span>
                  <span className="font-mono text-slate-700">{formatCurrency(general)} ({generalPct}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${generalPct}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-emerald-800">Kover Klaim BPJS Kesehatan</span>
                  <span className="font-mono text-emerald-700">{formatCurrency(bpjs)} ({bpjsPct}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${bpjsPct}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
