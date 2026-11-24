import React from 'react';
import { Card, CardHeader, CardContent } from '../../../components/ui';

export interface TopMedicineItem {
  medicine_name: string;
  unit: string;
  total_prescribed: number;
}

export interface TopMedicinesTableProps {
  data: TopMedicineItem[];
  isLoading: boolean;
}

export const TopMedicinesTable: React.FC<TopMedicinesTableProps> = ({ data, isLoading }) => {
  return (
    <Card className="w-full bg-white border border-border-default shadow-sm">
      <CardHeader className="border-b border-border-default pb-3">
        <h3 className="text-base font-bold text-text-main">
          5 Obat Paling Banyak Diresepkan
        </h3>
        <p className="text-xs text-text-muted">
          Monitoring penggunaan perbekalan farmasi rawat jalan
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-text-muted">Memuat data obat...</div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted">Belum ada resep obat.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-text-muted font-semibold border-b border-border-default uppercase">
              <tr>
                <th className="py-2.5 px-4">Nama Obat</th>
                <th className="py-2.5 px-4">Satuan</th>
                <th className="py-2.5 px-4 text-right">Diresepkan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {data.map((med, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-semibold text-text-main">
                    {med.medicine_name}
                  </td>
                  <td className="py-2.5 px-4 text-text-muted">{med.unit}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-primary">
                    {med.total_prescribed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
};
