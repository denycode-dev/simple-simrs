import React, { useState } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHeaderCell } from '@astryxdesign/core/Table';
import { HStack } from '@astryxdesign/core/HStack';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/utils/formatters';

export interface PrescriptionItemDetail {
  id: number;
  medicine_id?: number;
  medicine_name: string;
  medicine_code?: string;
  quantity: number;
  dosage: string;
  subtotal: number;
  current_stock?: number;
}

export interface PrescriptionDetail {
  id: number;
  prescription_number: string;
  patient_name: string;
  medical_record_number: string;
  doctor_name: string;
  total_price: number;
  status: 'PENDING' | 'DISPENSED' | 'CANCELLED';
  created_at: string;
  items: PrescriptionItemDetail[];
}

export interface PrescriptionDispenseModalProps {
  prescription: PrescriptionDetail;
  onClose: () => void;
  onSuccess: () => void;
}

export const PrescriptionDispenseModal: React.FC<PrescriptionDispenseModalProps> = ({
  prescription,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDispense = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient(`/pharmacy/prescriptions/${prescription.id}/dispense`, {
        method: 'POST',
      });

      setSuccess('Resep berhasil diserahkan. Stok obat otomatis terpotong atomik dan tagihan diteruskan ke Kasir.');
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyerahkan obat resep farmasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={true}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
      width={720}
      purpose="form"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispense-modal-title"
    >
      <div className="p-6 bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <DialogHeader
          title={
            <div>
              <HStack justify="between" align="center" className="mb-1">
                <span className="font-mono font-bold text-xs text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                  {prescription.prescription_number}
                </span>
                <Badge
                  variant={prescription.status === 'DISPENSED' ? 'success' : 'warning'}
                  label={prescription.status === 'DISPENSED' ? 'Sudah Diserahkan' : 'Menunggu Dispensing'}
                />
              </HStack>
              <h2 id="dispense-modal-title" className="text-xl font-bold text-slate-900 mt-1">
                Telaah & Penyerahan Obat Farmasi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pasien: <strong>{prescription.patient_name}</strong> ({prescription.medical_record_number}) • Dokter DPJP: {prescription.doctor_name}
              </p>
            </div>
          }
          onOpenChange={() => !isSubmitting && onClose()}
        />

        <div className="flex-1 overflow-y-auto mt-4 space-y-4">
          {error && <Banner status="error" title="Gagal Dispensing" description={error} container="card" />}
          {success && <Banner status="success" title="Dispensing Berhasil" description={success} container="card" />}

          {/* Checklist Telaah Resep */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
            <strong>Prosedur Telaah Farmasi (5 Tepat):</strong> Pastikan tepat pasien, tepat obat, tepat dosis, tepat rute pemberian, dan tepat waktu.
          </div>

          {/* Tabel Rincian Obat Resep */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table density="balanced" dividers="rows" hasHover>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Nama Obat</TableHeaderCell>
                  <TableHeaderCell style={{ width: '80px', textAlign: 'center' }}>Jumlah</TableHeaderCell>
                  <TableHeaderCell>Aturan Pakai (Signa)</TableHeaderCell>
                  <TableHeaderCell style={{ width: '130px', textAlign: 'right' }}>Subtotal</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescription.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-bold text-slate-900 text-sm">{item.medicine_name}</div>
                      {item.medicine_code && (
                        <div className="text-xs font-mono text-slate-400">
                          {item.medicine_code}
                        </div>
                      )}
                    </TableCell>
                    <TableCell style={{ textAlign: 'center', fontWeight: 600 }}>
                      {item.quantity}
                    </TableCell>
                    <TableCell>
                      <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded text-xs font-medium">
                        {item.dosage}
                      </span>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                      {formatCurrency(item.subtotal)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow style={{ backgroundColor: 'rgba(248, 250, 252, 0.8)', fontWeight: 700 }}>
                  <TableCell colSpan={3} style={{ textAlign: 'right' }}>
                    Total Biaya Resep:
                  </TableCell>
                  <TableCell style={{ textAlign: 'right', fontFamily: 'monospace', color: '#0d9488' }}>
                    {formatCurrency(prescription.total_price)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <HStack justify="end" gap={3} className="pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="secondary"
            label="Tutup"
            onClick={onClose}
            isDisabled={isSubmitting}
          />
          {prescription.status === 'PENDING' && (
            <Button
              type="button"
              variant="primary"
              label="Konfirmasi & Serahkan Obat (Dispensing)"
              onClick={handleDispense}
              isLoading={isSubmitting}
              isDisabled={isSubmitting}
            />
          )}
        </HStack>
      </div>
    </Dialog>
  );
};
