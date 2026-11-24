import React from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { HStack } from '@astryxdesign/core/HStack';

export interface QueueTicketData {
  id: number;
  queue_number: string;
  queue_sequence: number;
  patient_name: string;
  medical_record_number: string;
  nik?: string;
  polyclinic_name: string;
  doctor_name: string;
  insurance_type: 'GENERAL' | 'BPJS';
  registration_date: string;
  status: string;
}

export interface QueueTicketModalProps {
  ticket: QueueTicketData;
  onClose: () => void;
}

export const QueueTicketModal: React.FC<QueueTicketModalProps> = ({ ticket, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      isOpen={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      width={460}
      purpose="info"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
    >
      <div className="p-6 bg-white rounded-xl shadow-2xl flex flex-col border-2 border-dashed border-teal-300">
        <DialogHeader
          title={
            <div className="text-center w-full">
              <span className="text-xs font-bold text-teal-700 tracking-wider uppercase">
                RUMAH SAKIT INOVA MEDIKA
              </span>
              <h2 id="ticket-modal-title" className="text-lg font-bold text-slate-900 mt-1">
                Karcis Antrean Rawat Jalan
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {ticket.registration_date} • Loket Pendaftaran
              </p>
            </div>
          }
          onOpenChange={() => onClose()}
        />

        <div className="py-4 space-y-4 text-center">
          {/* Nomor Antrean Utama */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <span className="text-xs text-teal-800 font-semibold uppercase tracking-wider">
              NOMOR ANTREAN ANDA
            </span>
            <div className="text-5xl font-extrabold font-mono text-teal-900 my-1 tracking-wider">
              {ticket.queue_number}
            </div>
            <div className="text-xs text-slate-600 font-medium">
              Urutan Ke: <strong>{ticket.queue_sequence}</strong>
            </div>
          </div>

          {/* Rincian Kunjungan */}
          <div className="text-left bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Pasien:</span>
              <strong className="text-slate-900">{ticket.patient_name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">No. Rekam Medis:</span>
              <span className="font-mono font-bold text-teal-700">
                {ticket.medical_record_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Poli Tujuan:</span>
              <strong className="text-slate-900">{ticket.polyclinic_name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dokter DPJP:</span>
              <span className="text-slate-800 font-medium">{ticket.doctor_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Penjamin:</span>
              <Badge
                variant={ticket.insurance_type === 'BPJS' ? 'success' : 'teal'}
                label={ticket.insurance_type === 'BPJS' ? 'BPJS Kesehatan' : 'Umum / Mandiri'}
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs text-left">
            Silakan menunggu di ruang Triage untuk pemeriksaan tanda-tanda vital oleh Perawat (Status: WAITING_NURSE).
          </div>
        </div>

        <HStack justify="end" gap={3} className="pt-3 border-t border-slate-200">
          <Button variant="secondary" size="md" label="Tutup" onClick={onClose} />
          <Button variant="primary" size="md" label="🖨️ Cetak Karcis" onClick={handlePrint} />
        </HStack>
      </div>
    </Dialog>
  );
};
