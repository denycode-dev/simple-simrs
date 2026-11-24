import React from 'react';
import { Card, CardHeader, CardContent } from '../../../components/ui';

export interface PolyclinicStat {
  polyclinic_name: string;
  visit_count: number;
}

export interface VisitsByPolyChartProps {
  data: PolyclinicStat[];
  isLoading: boolean;
}

export const VisitsByPolyChart: React.FC<VisitsByPolyChartProps> = ({ data, isLoading }) => {
  const total = data.reduce((acc, curr) => acc + curr.visit_count, 0);

  return (
    <Card className="w-full bg-white border border-border-default shadow-sm">
      <CardHeader className="border-b border-border-default pb-3">
        <h3 className="text-base font-bold text-text-main">
          Distribusi Kunjungan per Poliklinik
        </h3>
        <p className="text-xs text-text-muted">
          Porsi beban antrean pasien rawat jalan antar spesialisasi
        </p>
      </CardHeader>
      <CardContent className="p-4 space-y-3.5">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-text-muted">Memuat data poli...</div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted">Tidak ada data kunjungan.</div>
        ) : (
          data.map((poly) => {
            const percentage = total > 0 ? Math.round((poly.visit_count / total) * 100) : 0;

            return (
              <div key={poly.polyclinic_name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-text-main">{poly.polyclinic_name}</span>
                  <span className="font-mono text-text-muted">
                    {poly.visit_count} Pasien ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(percentage, 3)}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
