import React, { useState } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHeaderCell } from '@astryxdesign/core/Table';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Selector } from '@astryxdesign/core/Selector';
import { Spinner } from '@astryxdesign/core/Spinner';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import type { LabOrderDetail } from './LabResultModal';

export interface LabWorklistTableProps {
  orders: LabOrderDetail[];
  isLoading: boolean;
  onOpenResultModal: (order: LabOrderDetail) => void;
  onRefresh?: () => void;
}

export const LabWorklistTable: React.FC<LabWorklistTableProps> = ({
  orders,
  isLoading,
  onOpenResultModal,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.medical_record_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.doctor_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <Badge variant="warning" label="Menunggu Sampel" />;
      case 'IN_PROGRESS':
        return <Badge variant="info" label="Sedang Diuji" />;
      case 'COMPLETED':
        return <Badge variant="success" label="Selesai" />;
      case 'CANCELLED':
        return <Badge variant="neutral" label="Dibatalkan" />;
      default:
        return <Badge variant="neutral" label={status} />;
    }
  };

  return (
    <Card elevation="low" padding={4}>
      <VStack gap={4}>
        {/* Header */}
        <HStack justify="between" align="center" className="border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Daftar Kerja Laboratorium (Lab Worklist)
            </h2>
            <p className="text-sm text-slate-500">
              Kelola antrean uji laboratorium penunjang rawat jalan dan verifikasi hasil analisis
            </p>
          </div>

          {onRefresh && (
            <Button
              variant="secondary"
              size="sm"
              label="Segarkan Antrean"
              onClick={onRefresh}
              isDisabled={isLoading}
            />
          )}
        </HStack>

        {/* Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <TextInput
              label="Pencarian"
              isLabelHidden
              placeholder="Cari nomor order, nomor RM, nama pasien, atau dokter..."
              value={searchTerm}
              onChange={(val) => setSearchTerm(val)}
              width="100%"
            />
          </div>
          <div>
            <Selector
              label="Status Filter"
              isLabelHidden
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'ALL', label: 'Semua Status' },
                { value: 'REQUESTED', label: 'Menunggu Sampel' },
                { value: 'IN_PROGRESS', label: 'Sedang Diuji' },
                { value: 'COMPLETED', label: 'Selesai' },
              ]}
              width="100%"
            />
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Spinner size="md" />
            <p className="text-sm text-slate-500">Memuat data antrean laboratorium...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            title="Tidak Ada Antrean Laboratorium"
            description="Tidak ditemukan data pemeriksaan laboratorium dengan filter yang dipilih."
          />
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table density="balanced" dividers="rows" hasHover>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>No. Order</TableHeaderCell>
                  <TableHeaderCell>Pasien & No. RM</TableHeaderCell>
                  <TableHeaderCell>Dokter & Poli</TableHeaderCell>
                  <TableHeaderCell>Parameter Uji</TableHeaderCell>
                  <TableHeaderCell>Status & Indikasi</TableHeaderCell>
                  <TableHeaderCell style={{ textAlign: 'center' }}>Aksi</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const hasAbnormal = order.items.some((i) => i.status_flag === 'ABNORMAL');

                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <span className="font-mono font-bold text-teal-700 text-xs">
                          {order.order_number}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900 text-sm">{order.patient_name}</div>
                        <div className="font-mono text-xs text-slate-500">
                          {order.medical_record_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-800 text-xs">{order.doctor_name}</div>
                        <div className="text-xs text-slate-500">{order.polyclinic_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {order.items.map((i) => (
                            <div key={i.id} className="flex items-center gap-1.5">
                              <span>• {i.test_name}</span>
                              {i.status_flag === 'ABNORMAL' && (
                                <Badge variant="error" label="ABNORMAL" />
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5 items-start">
                          {getStatusBadge(order.status)}
                          {hasAbnormal && (
                            <Badge variant="error" label="Ada Nilai ABNORMAL" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell style={{ textAlign: 'center' }}>
                        <Button
                          variant={order.status === 'COMPLETED' ? 'secondary' : 'primary'}
                          size="sm"
                          label={order.status === 'COMPLETED' ? 'Lihat Hasil' : 'Input Hasil'}
                          onClick={() => onOpenResultModal(order)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </VStack>
    </Card>
  );
};
