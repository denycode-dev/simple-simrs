import React from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHeaderCell } from '@astryxdesign/core/Table';
import { Spinner } from '@astryxdesign/core/Spinner';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { VStack } from '@astryxdesign/core/VStack';

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
    <Card elevation="low" padding={4}>
      <VStack gap={3}>
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-base font-bold text-slate-900">
            5 Obat Paling Banyak Diresepkan
          </h3>
          <p className="text-xs text-slate-500">
            Monitoring penggunaan perbekalan farmasi rawat jalan
          </p>
        </div>

        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <Spinner size="sm" />
            <span className="text-xs text-slate-500">Memuat data obat...</span>
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            title="Belum Ada Resep Obat"
            description="Tidak ada resep obat farmasi yang tercatat pada periode ini."
            isCompact
          />
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table density="balanced" dividers="rows" hasHover>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Nama Obat</TableHeaderCell>
                  <TableHeaderCell>Satuan</TableHeaderCell>
                  <TableHeaderCell style={{ textAlign: 'right' }}>Total Diresepkan</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((med, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <span className="font-semibold text-slate-900 text-sm">
                        {med.medicine_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-500">{med.unit}</span>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <span className="font-mono font-bold text-teal-700 text-sm">
                        {med.total_prescribed}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </VStack>
    </Card>
  );
};
