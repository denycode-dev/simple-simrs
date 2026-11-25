import React, { useState } from 'react';
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
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  const isBpjs = ticket.insurance_type === 'BPJS';

  return (
    <Dialog
      isOpen={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      width={480}
      purpose="info"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-queue-ticket, #printable-queue-ticket * {
            visibility: visible !important;
          }
          #printable-queue-ticket {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 16px !important;
            border: 1px dashed #000 !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        id="printable-queue-ticket"
        style={{
          padding: 'var(--space-6)',
          overflow: 'scroll',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          border: '2px dashed var(--color-primary-border)',
          fontFamily: 'var(--font-family-base)',
          color: 'var(--color-text-main)',
        }}
      >
        <DialogHeader
          title={
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                RUMAH SAKIT INOVA MEDIKA
              </div>
              <h2
                id="ticket-modal-title"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--color-text-main)',
                  margin: '4px 0 2px 0',
                }}
              >
                Karcis Antrean Rawat Jalan
              </h2>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                {ticket.registration_date || 'Hari ini'} • Loket Pendaftaran
              </p>
            </div>
          }
          onOpenChange={() => onClose()}
        />

        <div style={{ padding: 'var(--space-4) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Nomor Antrean Utama & Poli (Informasi Paling Penting) */}
          <div
            style={{
              backgroundColor: 'var(--color-primary-light)',
              border: '1.5px solid var(--color-primary-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--color-primary)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'block',
              }}
            >
              NOMOR ANTREAN ANDA
            </span>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                fontFamily: 'monospace',
                color: 'var(--color-primary-dark)',
                letterSpacing: '0.05em',
                lineHeight: 1.1,
                margin: '6px 0',
              }}
            >
              {ticket.queue_number}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                fontWeight: 600,
              }}
            >
              <span>Poli: <strong>{ticket.polyclinic_name}</strong></span>
              <span>•</span>
              <span>Urutan Ke: <strong>{ticket.queue_sequence}</strong></span>
            </div>
          </div>

          {/* Rincian Kunjungan Pasien */}
          <div
            style={{
              backgroundColor: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              fontSize: '0.8125rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Nama Pasien:</span>
              <strong style={{ color: 'var(--color-text-main)', fontSize: '0.875rem' }}>
                {ticket.patient_name || '-'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>No. Rekam Medis:</span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                }}
              >
                {ticket.medical_record_number || '-'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Poli Tujuan:</span>
              <strong style={{ color: 'var(--color-text-main)' }}>
                {ticket.polyclinic_name || '-'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Dokter DPJP:</span>
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                {ticket.doctor_name || '-'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Penjamin:</span>
              <HStack gap={1} align="center">
                <span aria-hidden="true" style={{ fontSize: '0.8125rem' }}>{isBpjs ? '🛡️' : '💵'}</span>
                <Badge
                  variant={isBpjs ? 'success' : 'teal'}
                  label={isBpjs ? 'BPJS Kesehatan' : 'Umum / Mandiri'}
                />
              </HStack>
            </div>
          </div>

          {/* Panduan Langkah Edukatif Bagi Pasien (Bukan Status Teknis Backend) */}
          <div
            style={{
              backgroundColor: 'var(--color-warning-bg)',
              border: '1px solid var(--color-warning-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)',
              textAlign: 'left',
              color: 'var(--color-warning-text)',
              fontSize: '0.75rem',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
              <span aria-hidden="true">⏳</span>
              <span>Langkah Pelayanan Selanjutnya:</span>
            </div>
            <div>
              Silakan menunggu di ruang Triage untuk pemeriksaan tanda-tanda vital oleh Perawat (Status: Menunggu Skrining Nakes).
            </div>
          </div>
        </div>

        <HStack
          justify="end"
          gap={3}
          className="no-print"
          style={{
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <Button
            variant="secondary"
            size="md"
            label="Tutup"
            onClick={onClose}
          />
          <Button
            variant="primary"
            size="md"
            label={isPrinting ? 'Menyiapkan Cetak...' : '🖨️ Cetak Karcis'}
            onClick={handlePrint}
            isLoading={isPrinting}
          />
        </HStack>
      </div>
    </Dialog>
  );
};
