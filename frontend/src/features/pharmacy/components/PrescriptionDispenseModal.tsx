import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Alert, Badge } from '@/components/ui';
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispense-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        zIndex: 65,
      }}
      onClick={() => !isSubmitting && onClose()}
    >
      <div style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <Card elevation="high" padding={6} style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}>
          <CardHeader style={{ paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border-subtle)', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  color: 'var(--color-primary)',
                  backgroundColor: 'var(--color-primary-light)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-primary-border)',
                }}
              >
                {prescription.prescription_number}
              </span>
              <Badge
                variant={prescription.status === 'DISPENSED' ? 'success' : 'warning'}
                label={prescription.status === 'DISPENSED' ? 'Sudah Diserahkan' : 'Menunggu Dispensing'}
              />
            </div>
            <CardTitle id="dispense-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: 'var(--space-2)' }}>
              Telaah & Penyerahan Obat Farmasi
            </CardTitle>
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Pasien: <strong>{prescription.patient_name}</strong> ({prescription.medical_record_number}) • Dokter DPJP: {prescription.doctor_name}
            </div>
          </CardHeader>

          <CardContent style={{ padding: 0 }}>
            {error && <div style={{ marginBottom: 'var(--space-4)' }}><Alert variant="danger">{error}</Alert></div>}
            {success && <div style={{ marginBottom: 'var(--space-4)' }}><Alert variant="success">{success}</Alert></div>}

            {/* Checklist Telaah Resep */}
            <div
              style={{
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <strong>Prosedur Telaah Farmasi (5 Tepat):</strong> Pastikan tepat pasien, tepat obat, tepat dosis, tepat rute pemberian, dan tepat waktu.
            </div>

            {/* Tabel Rincian Obat Resep */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-4)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Nama Obat</th>
                    <th style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '80px', textAlign: 'center' }}>Jumlah</th>
                    <th style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Aturan Pakai (Signa)</th>
                    <th style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '120px', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {prescription.items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{item.medicine_name}</div>
                        {item.medicine_code && (
                          <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                            {item.medicine_code}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'center', fontWeight: 600 }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--color-text-secondary)' }}>
                        <span style={{ backgroundColor: 'var(--color-primary-light)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem', color: 'var(--color-primary-dark)' }}>
                          {item.dosage}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: 'var(--color-surface-hover)', fontWeight: 700 }}>
                    <td colSpan={3} style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right' }}>
                      Total Biaya Resep:
                    </td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                      {formatCurrency(prescription.total_price)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tombol Aksi */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--space-3)',
                paddingTop: 'var(--space-3)',
                borderTop: '1px solid var(--color-border-subtle)',
              }}
            >
              <Button
                type="button"
                variant="secondary"
                size="md"
                label="Tutup"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Tutup
              </Button>
              {prescription.status === 'PENDING' && (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  label="Konfirmasi & Serahkan Obat (Dispensing)"
                  onClick={handleDispense}
                  isLoading={isSubmitting}
                >
                  Konfirmasi & Serahkan Obat (Dispensing)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
