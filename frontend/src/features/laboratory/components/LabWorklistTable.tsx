import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Badge } from '../../../components/ui';
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
        return <Badge variant="warning">Menunggu Sampel</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info">Sedang Diuji</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Selesai</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral">Dibatalkan</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <Card className="w-full bg-white border border-border-default shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-default pb-4">
        <div>
          <h2 className="text-lg font-bold text-text-main">
            Daftar Kerja Laboratorium (Lab Worklist)
          </h2>
          <p className="text-sm text-text-muted">
            Kelola antrean uji laboratorium penunjang rawat jalan dan verifikasi hasil analisis
          </p>
        </div>

        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            Segarkan Antrean
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari nomor order, nomor RM, nama pasien, atau dokter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">Semua Status</option>
              <option value="REQUESTED">Menunggu Sampel</option>
              <option value="IN_PROGRESS">Sedang Diuji</option>
              <option value="COMPLETED">Selesai</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="py-12 text-center text-text-muted">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-2"></div>
            <p className="text-sm">Memuat data antrean laboratorium...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-border-default rounded-lg">
            <p className="text-sm font-medium text-text-muted">
              Tidak ada antrean pemeriksaan laboratorium yang ditemukan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border-default rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-text-muted border-b border-border-default font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No. Order</th>
                  <th className="py-3 px-4">Pasien & No. RM</th>
                  <th className="py-3 px-4">Dokter & Poli</th>
                  <th className="py-3 px-4">Parameter Uji</th>
                  <th className="py-3 px-4">Status & Indikasi</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filteredOrders.map((order) => {
                  const hasAbnormal = order.items.some((i) => i.status_flag === 'ABNORMAL');

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-medium text-primary text-xs">
                          {order.order_number}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-text-main">{order.patient_name}</div>
                        <div className="font-mono text-xs text-text-muted">
                          {order.medical_record_number}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-text-main text-xs">{order.doctor_name}</div>
                        <div className="text-xs text-text-muted">{order.polyclinic_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs space-y-0.5">
                          {order.items.map((i) => (
                            <div key={i.id} className="flex items-center gap-1.5">
                              <span>• {i.test_name}</span>
                              {i.status_flag === 'ABNORMAL' && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                  ABNORMAL
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(order.status)}
                          {hasAbnormal && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-700">
                              Ada Nilai ABNORMAL
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant={order.status === 'COMPLETED' ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => onOpenResultModal(order)}
                        >
                          {order.status === 'COMPLETED' ? 'Lihat Hasil' : 'Input Hasil'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
