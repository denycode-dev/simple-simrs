import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Badge } from '../../../components/ui';
import { formatCurrency } from '../../../utils/formatters';
import type { BillingDetail } from './PaymentModal';

export interface BillingQueueTableProps {
  billings: BillingDetail[];
  isLoading: boolean;
  onOpenPayment: (billing: BillingDetail) => void;
  onOpenInvoice: (billing: BillingDetail) => void;
  onRefresh?: () => void;
}

export const BillingQueueTable: React.FC<BillingQueueTableProps> = ({
  billings,
  isLoading,
  onOpenPayment,
  onOpenInvoice,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [insuranceFilter, setInsuranceFilter] = useState<string>('ALL');

  const filteredBillings = billings.filter((b) => {
    const patientName = b.registration?.patient?.name || '';
    const mrn = b.registration?.patient?.medical_record_number || '';
    const doctor = b.registration?.doctor?.name || '';

    const matchesSearch =
      b.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || b.payment_status === statusFilter;
    const matchesInsurance = insuranceFilter === 'ALL' || b.insurance_type === insuranceFilter;

    return matchesSearch && matchesStatus && matchesInsurance;
  });

  return (
    <Card className="w-full bg-white border border-border-default shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-default pb-4">
        <div>
          <h2 className="text-lg font-bold text-text-main">
            Daftar Tagihan Kasir Rawat Jalan
          </h2>
          <p className="text-sm text-text-muted">
            Konsolidasi biaya pendaftaran, tindakan poliklinik, obat farmasi, dan pemeriksaan laboratorium
          </p>
        </div>

        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            Segarkan Tagihan
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari nomor invoice, no RM, nama pasien, atau dokter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="w-full sm:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">Semua Status</option>
              <option value="UNPAID">Belum Bayar (UNPAID)</option>
              <option value="PAID">Lunas (PAID)</option>
            </select>
          </div>
          <div className="w-full sm:w-44">
            <select
              value={insuranceFilter}
              onChange={(e) => setInsuranceFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">Semua Penjamin</option>
              <option value="GENERAL">Umum (Tunai)</option>
              <option value="BPJS">BPJS Kesehatan</option>
            </select>
          </div>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div className="py-12 text-center text-text-muted">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-2"></div>
            <p className="text-sm">Memuat data tagihan kasir...</p>
          </div>
        ) : filteredBillings.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-border-default rounded-lg">
            <p className="text-sm font-medium text-text-muted">
              Tidak ada tagihan billing rawat jalan yang ditemukan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border-default rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-text-muted border-b border-border-default font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No. Invoice</th>
                  <th className="py-3 px-4">Pasien & No. RM</th>
                  <th className="py-3 px-4">Layanan & DPJP</th>
                  <th className="py-3 px-4">Penjamin</th>
                  <th className="py-3 px-4 text-right">Total Tagihan</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi Kasir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filteredBillings.map((b) => {
                  const isBpjs = b.insurance_type === 'BPJS';
                  const isPaid = b.payment_status === 'PAID';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-medium text-primary text-xs">
                          {b.invoice_number}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-text-main">
                          {b.registration?.patient?.name || 'Pasien'}
                        </div>
                        <div className="font-mono text-xs text-text-muted">
                          {b.registration?.patient?.medical_record_number || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-text-main text-xs">
                          {b.registration?.polyclinic?.name || '-'}
                        </div>
                        <div className="text-xs text-text-muted">
                          {b.registration?.doctor?.name || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={isBpjs ? 'success' : 'neutral'}>
                          {isBpjs ? 'BPJS Kesehatan' : 'Umum (Tunai)'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-bold text-text-main">
                          {formatCurrency(Number(b.total_amount) || 0)}
                        </div>
                        {isBpjs && (
                          <div className="text-[11px] text-emerald-600 font-medium">
                            Kover BPJS: Rp 0
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={isPaid ? 'success' : 'warning'}>
                          {isPaid ? 'Lunas' : 'Belum Bayar'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isPaid ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenInvoice(b)}
                          >
                            Cetak Kuitansi
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onOpenPayment(b)}
                          >
                            Bayar Tagihan
                          </Button>
                        )}
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
