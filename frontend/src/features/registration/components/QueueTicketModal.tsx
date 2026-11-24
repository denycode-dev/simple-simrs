import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        zIndex: 70,
      }}
      onClick={onClose}
    >
      <div
        style={{ maxWidth: '440px', width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card
          elevation="high"
          padding={6}
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px dashed var(--color-primary-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <CardHeader style={{ textAlign: 'center', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              RUMAH SAKIT INOVA MEDIKA
            </div>
            <CardTitle id="ticket-modal-title" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '4px' }}>
              Karcis Antrean Rawat Jalan
            </CardTitle>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {ticket.registration_date} • Loket Pendaftaran
            </div>
          </CardHeader>

          <CardContent style={{ padding: 'var(--space-4) 0', textAlign: 'center' }}>
            {/* Nomor Antrean Utama */}
            <div
              style={{
                backgroundColor: 'var(--color-primary-light)',
                border: '1px solid var(--color-primary-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                NOMOR ANTREAN ANDA
              </div>
              <div
                style={{
                  fontSize: '2.75rem',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: 'var(--color-primary-dark)',
                  letterSpacing: '0.05em',
                  margin: '4px 0',
                }}
              >
                {ticket.queue_number}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                Urutan Ke: <strong>{ticket.queue_sequence}</strong>
              </div>
            </div>

            {/* Rincian Kunjungan */}
            <div
              style={{
                textAlign: 'left',
                backgroundColor: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3) var(--space-4)',
                fontSize: '0.8125rem',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Nama Pasien:</span>
                <strong style={{ color: 'var(--color-text-main)' }}>{ticket.patient_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>No. Rekam Medis:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {ticket.medical_record_number}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Poli Tujuan:</span>
                <strong style={{ color: 'var(--color-text-main)' }}>{ticket.polyclinic_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Dokter DPJP:</span>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{ticket.doctor_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Penjamin:</span>
                <Badge
                  variant={ticket.insurance_type === 'BPJS' ? 'success' : 'info'}
                  label={ticket.insurance_type === 'BPJS' ? 'BPJS Kesehatan' : 'Umum / Mandiri'}
                />
              </div>
            </div>

            {/* Catatan Alur */}
            <div
              style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-warning-bg)',
                color: 'var(--color-warning-text)',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            >
              Silakan menunggu di ruang Triage untuk pemeriksaan tanda-tanda vital oleh Perawat (Status: WAITING_NURSE).
            </div>
          </CardContent>

          <div
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              justifyContent: 'flex-end',
              paddingTop: 'var(--space-3)',
              borderTop: '1px solid var(--color-border-subtle)',
            }}
          >
            <Button variant="secondary" size="md" label="Tutup" onClick={onClose}>
              Tutup
            </Button>
            <Button variant="primary" size="md" label="🖨️ Cetak Karcis" onClick={handlePrint}>
              🖨️ Cetak Karcis
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
