import React from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { HStack } from '@astryxdesign/core/HStack';
import { formatCurrency } from '../../../utils/formatters';
import type { BillingDetail } from './PaymentModal';

export interface PrintableInvoiceProps {
  isOpen: boolean;
  billing: BillingDetail | null;
  onClose: () => void;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  isOpen,
  billing,
  onClose,
}) => {
  if (!isOpen || !billing) return null;

  const latestPayment = billing.payments && billing.payments.length > 0 ? billing.payments[0] : null;
  const isBpjs = billing.insurance_type === 'BPJS';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      width={720}
      purpose="info"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-title"
    >
      <div className="p-6 bg-white rounded-xl shadow-2xl flex flex-col max-h-[92vh]">
        <DialogHeader
          title={
            <HStack gap={3} align="center">
              <h2 id="invoice-title" className="text-lg font-bold text-slate-900">
                Kuitansi Resmi Pembayaran
              </h2>
              <Badge variant="success" label="LUNAS / TERBAYAR" />
            </HStack>
          }
          onOpenChange={() => onClose()}
        />

        <div className="flex-1 overflow-y-auto mt-4 space-y-6 print:p-0">
          {/* Hospital Header / Kop Surat */}
          <div className="text-center border-b-2 border-slate-800 pb-4">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
              RUMAH SAKIT UMUM INOVA MEDIKA
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Jl. Kesehatan No. 123, Bandung - Jawa Barat | Telp: (022) 7654321
            </p>
            <p className="text-xs text-slate-500">
              Izin Operasional RS No. 445/1029-Dinkes/2022
            </p>
            <div className="mt-3 inline-block bg-slate-100 px-4 py-1 rounded text-xs font-bold uppercase tracking-wider text-slate-800 border border-slate-300">
              KUITANSI PEMBAYARAN RAWAT JALAN
            </div>
          </div>

          {/* Meta & Patient Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <div>
                <span className="text-slate-500">No. Invoice:</span>{' '}
                <span className="font-mono font-bold text-slate-900">{billing.invoice_number}</span>
              </div>
              {latestPayment && (
                <div>
                  <span className="text-slate-500">No. Transaksi Kasir:</span>{' '}
                  <span className="font-mono font-semibold text-slate-800">{latestPayment.payment_number}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500">Waktu Pembayaran:</span>{' '}
                <span className="font-mono text-slate-800">
                  {latestPayment?.payment_date || new Date().toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Penjamin:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {isBpjs ? 'BPJS Kesehatan' : 'Pasien Umum (Tunai)'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div>
                <span className="text-slate-500">Nama Pasien:</span>{' '}
                <span className="font-bold text-slate-900">{billing.registration?.patient?.name || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">No. Rekam Medis:</span>{' '}
                <span className="font-mono font-semibold text-teal-700">
                  {billing.registration?.patient?.medical_record_number || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Layanan Poliklinik:</span>{' '}
                <span className="text-slate-800">{billing.registration?.polyclinic?.name || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">Dokter DPJP:</span>{' '}
                <span className="text-slate-800">{billing.registration?.doctor?.name || '-'}</span>
              </div>
            </div>
          </div>

          {/* Rincian Pos Tagihan */}
          <div className="border border-slate-300 rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 uppercase">
                <tr>
                  <th className="py-2 px-3 text-left">No</th>
                  <th className="py-2 px-3 text-left">Uraian Pelayanan Medis & Penunjang</th>
                  <th className="py-2 px-3 text-right">Subtotal Biaya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2 px-3 text-center">1</td>
                  <td className="py-2 px-3">Biaya Administrasi & Pendaftaran Pasien</td>
                  <td className="py-2 px-3 text-right font-mono">
                    {formatCurrency(Number(billing.total_registration_fee) || 0)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-center">2</td>
                  <td className="py-2 px-3">Tindakan Medis & Konsultasi Poliklinik</td>
                  <td className="py-2 px-3 text-right font-mono">
                    {formatCurrency(Number(billing.total_actions_fee) || 0)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-center">3</td>
                  <td className="py-2 px-3">Obat-obatan & Pelayanan Farmasi e-Resep</td>
                  <td className="py-2 px-3 text-right font-mono">
                    {formatCurrency(Number(billing.total_medicines_fee) || 0)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-center">4</td>
                  <td className="py-2 px-3">Pemeriksaan Penunjang Laboratorium Klinis</td>
                  <td className="py-2 px-3 text-right font-mono">
                    {formatCurrency(Number(billing.total_lab_fee) || 0)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                <tr>
                  <td colSpan={2} className="py-2 px-3 text-right">
                    Total Biaya Pelayanan:
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-900">
                    {formatCurrency(Number(billing.total_amount) || 0)}
                  </td>
                </tr>
                {isBpjs && (
                  <tr className="text-emerald-700">
                    <td colSpan={2} className="py-1 px-3 text-right font-semibold">
                      Ditanggung Penuh BPJS Kesehatan:
                    </td>
                    <td className="py-1 px-3 text-right font-mono">
                      - {formatCurrency(Number(billing.covered_by_bpjs) || Number(billing.total_amount))}
                    </td>
                  </tr>
                )}
                <tr className="text-slate-900 text-sm">
                  <td colSpan={2} className="py-2 px-3 text-right">
                    Total Yang Dibayarkan Pasien:
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-teal-700 font-bold">
                    {formatCurrency(Number(billing.patient_payable) || 0)}
                  </td>
                </tr>
                {latestPayment && latestPayment.payment_method === 'CASH' && (
                  <>
                    <tr className="text-slate-600 font-normal">
                      <td colSpan={2} className="py-1 px-3 text-right">
                        Uang Tunai Diterima:
                      </td>
                      <td className="py-1 px-3 text-right font-mono">
                        {formatCurrency(Number(latestPayment.amount_received) || 0)}
                      </td>
                    </tr>
                    <tr className="text-slate-600 font-normal">
                      <td colSpan={2} className="py-1 px-3 text-right">
                        Uang Kembalian:
                      </td>
                      <td className="py-1 px-3 text-right font-mono">
                        {formatCurrency(Number(latestPayment.change_amount) || 0)}
                      </td>
                    </tr>
                  </>
                )}
              </tfoot>
            </table>
          </div>

          {/* Signature & Stamp Section */}
          <div className="grid grid-cols-2 gap-4 text-xs pt-4">
            <div className="text-center">
              <p className="text-slate-500 mb-14">Pasien / Keluarga Pasien</p>
              <p className="font-semibold text-slate-800 border-t border-slate-300 pt-1 inline-block min-w-36">
                ( {billing.registration?.patient?.name || 'Pasien'} )
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-500 mb-14">Petugas Kasir Rawat Jalan</p>
              <p className="font-semibold text-slate-800 border-t border-slate-300 pt-1 inline-block min-w-36">
                ( Petugas Kasir SIMRS )
              </p>
            </div>
          </div>
        </div>

        <HStack justify="between" align="center" className="pt-4 border-t border-slate-200 print:hidden">
          <p className="text-xs text-slate-500">
            Kuitansi sah yang diterbitkan secara elektronik oleh SIMRS Inova Medika.
          </p>
          <HStack gap={2}>
            <Button variant="secondary" label="Tutup" onClick={onClose} />
            <Button variant="primary" label="Cetak Kuitansi" onClick={handlePrint} />
          </HStack>
        </HStack>
      </div>
    </Dialog>
  );
};
