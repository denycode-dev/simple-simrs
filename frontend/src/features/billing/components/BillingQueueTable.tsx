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
    <Card elevation="low" padding={4}>
      <VStack gap={4}>
        <HStack justify="between" align="center" className="border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Daftar Tagihan Kasir Rawat Jalan
            </h2>
            <p className="text-sm text-slate-500">
              Konsolidasi biaya pendaftaran, tindakan poliklinik, obat farmasi, dan pemeriksaan laboratorium
            </p>
          </div>

          {onRefresh && (
            <Button
              variant="secondary"
              size="sm"
              label="Segarkan Tagihan"
              onClick={onRefresh}
              isDisabled={isLoading}
            />
          )}
        </HStack>

        {/* Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <TextInput
              label="Pencarian Tagihan"
              isLabelHidden
              placeholder="Cari nomor invoice, no RM, nama pasien, atau dokter..."
              value={searchTerm}
              onChange={(val) => setSearchTerm(val)}
              width="100%"
            />
          </div>
          <div>
            <Selector
              label="Status Tagihan"
              isLabelHidden
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'ALL', label: 'Semua Status' },
                { value: 'UNPAID', label: 'Belum Bayar (UNPAID)' },
                { value: 'PAID', label: 'Lunas (PAID)' },
              ]}
              width="100%"
            />
          </div>
          <div>
            <Selector
              label="Jenis Penjamin"
              isLabelHidden
              value={insuranceFilter}
              onChange={(val) => setInsuranceFilter(val)}
              options={[
                { value: 'ALL', label: 'Semua Penjamin' },
                { value: 'GENERAL', label: 'Umum (Tunai)' },
                { value: 'BPJS', label: 'BPJS Kesehatan' },
              ]}
              width="100%"
            />
          </div>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Spinner size="md" />
            <p className="text-sm text-slate-500">Memuat data tagihan kasir...</p>
          </div>
        ) : filteredBillings.length === 0 ? (
          <EmptyState
            title="Tidak Ada Tagihan Ditemukan"
            description="Tidak ditemukan data tagihan kasir rawat jalan dengan kriteria filter saat ini."
          />
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table density="balanced" dividers="rows" hasHover>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>No. Invoice</TableHeaderCell>
                  <TableHeaderCell>Pasien & No. RM</TableHeaderCell>
                  <TableHeaderCell>Layanan & DPJP</TableHeaderCell>
                  <TableHeaderCell>Penjamin</TableHeaderCell>
                  <TableHeaderCell style={{ textAlign: 'right' }}>Total Tagihan</TableHeaderCell>
                  <TableHeaderCell style={{ textAlign: 'center' }}>Status</TableHeaderCell>
                  <TableHeaderCell style={{ textAlign: 'center' }}>Aksi Kasir</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBillings.map((b) => {
                  const isBpjs = b.insurance_type === 'BPJS';
                  const isPaid = b.payment_status === 'PAID';

                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        <span className="font-mono font-bold text-teal-700 text-xs">
                          {b.invoice_number}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900 text-sm">
                          {b.registration?.patient?.name || 'Pasien'}
                        </div>
                        <div className="font-mono text-xs text-slate-500">
                          {b.registration?.patient?.medical_record_number || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-800 text-xs">
                          {b.registration?.polyclinic?.name || '-'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {b.registration?.doctor?.name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isBpjs ? 'success' : 'neutral'}
                          label={isBpjs ? 'BPJS Kesehatan' : 'Umum (Tunai)'}
                        />
                      </TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {formatCurrency(Number(b.total_amount) || 0)}
                        </div>
                        {isBpjs && (
                          <div className="text-[11px] text-emerald-600 font-medium">
                            Kover BPJS: Rp 0
                          </div>
                        )}
                      </TableCell>
                      <TableCell style={{ textAlign: 'center' }}>
                        <Badge
                          variant={isPaid ? 'success' : 'warning'}
                          label={isPaid ? 'Lunas' : 'Belum Bayar'}
                        />
                      </TableCell>
                      <TableCell style={{ textAlign: 'center' }}>
                        {isPaid ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            label="Cetak Kuitansi"
                            onClick={() => onOpenInvoice(b)}
                          />
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            label="Bayar Tagihan"
                            onClick={() => onOpenPayment(b)}
                          />
                        )}
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
