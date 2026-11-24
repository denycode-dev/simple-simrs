import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Alert, Badge } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { PrescriptionDispenseModal, type PrescriptionDetail } from './PrescriptionDispenseModal';

export const PrescriptionQueueTable: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionDetail | null>(null);

  const loadPrescriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient<{ success: boolean; data: any[] }>('/pharmacy/prescriptions', {
        params: statusFilter !== 'ALL' ? { status: statusFilter } : undefined,
      });

      // Normalisasi format respons jika data bersarang
      const list = (Array.isArray(res.data) ? res.data : []).map((p: any) => ({
        id: p.id,
        prescription_number: p.prescription_number || `RX-${p.id}`,
        patient_name: p.patient?.name || p.registration?.patient?.name || 'Pasien',
        medical_record_number: p.patient?.medical_record_number || p.registration?.patient?.medical_record_number || '-',
        doctor_name: p.doctor?.name || p.examination?.doctor?.name || 'Dokter DPJP',
        total_price: Number(p.total_price) || 0,
        status: p.status || 'PENDING',
        created_at: p.created_at || '',
        items: (p.items || []).map((it: any) => ({
          id: it.id,
          medicine_name: it.medicine?.name || it.medicine_name || `Obat #${it.medicine_id}`,
          medicine_code: it.medicine?.code,
          quantity: Number(it.quantity) || 1,
          dosage: it.dosage || it.signa || 'Sesuai petunjuk dokter',
          subtotal: Number(it.subtotal) || 0,
        })),
      }));

      setPrescriptions(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat antrean resep farmasi.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  return (
    <section aria-labelledby="pharmacy-queue-heading">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-5)',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div>
          <h2
            id="pharmacy-queue-heading"
            style={{
              fontSize: '1.375rem',
              fontWeight: 700,
              color: 'var(--color-text-main)',
              letterSpacing: '-0.01em',
            }}
          >
            Antrean e-Resep & Dispensing Farmasi
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Telaah resep dokter, verifikasi 5 tepat, dan penyerahan obat dengan pemotongan stok atomik.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          label="Segarkan Resep"
          onClick={loadPrescriptions}
          isLoading={isLoading}
        >
          Segarkan Resep
        </Button>
      </div>

      {/* Filter Status Resep */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        {[
          { id: 'ALL', label: 'Semua Resep' },
          { id: 'PENDING', label: 'Menunggu Penyerahan (PENDING)' },
          { id: 'DISPENSED', label: 'Sudah Diserahkan (DISPENSED)' },
        ].map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '0.375rem 0.875rem',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 500,
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'var(--color-surface)',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="danger" title="Gagal Memuat Antrean Resep">{error}</Alert>
        </div>
      )}

      {/* Tabel Antrean Resep */}
      <Card elevation="low" padding={0} style={{ overflow: 'hidden', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '160px' }}>No. Resep</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', minWidth: '220px' }}>Nama Pasien & No. RM</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '180px' }}>Dokter Penulis Resep</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '120px', textAlign: 'center' }}>Jumlah Obat</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '140px' }}>Total Biaya</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '140px' }}>Status</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '180px', textAlign: 'center' }}>Aksi Farmasi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Memuat antrean resep farmasi...
                  </td>
                </tr>
              ) : prescriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>💊</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Tidak ada resep pada status ini</div>
                  </td>
                </tr>
              ) : (
                prescriptions.map((rx) => (
                  <tr key={rx.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          color: 'var(--color-primary)',
                          backgroundColor: 'var(--color-primary-light)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-primary-border)',
                          display: 'inline-block',
                        }}
                      >
                        {rx.prescription_number}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {formatDate(rx.created_at)}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>{rx.patient_name}</div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {rx.medical_record_number}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      {rx.doctor_name}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center', fontWeight: 600 }}>
                      {rx.items.length} macam
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-text-main)' }}>
                      {formatCurrency(rx.total_price)}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <Badge
                        variant={rx.status === 'DISPENSED' ? 'success' : 'warning'}
                        label={rx.status === 'DISPENSED' ? 'Diserahkan' : 'Menunggu Telaah'}
                      />
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                      <Button
                        variant={rx.status === 'PENDING' ? 'primary' : 'secondary'}
                        size="sm"
                        label={rx.status === 'PENDING' ? 'Telaah & Serahkan' : 'Lihat Rincian'}
                        onClick={() => setSelectedPrescription(rx)}
                      >
                        {rx.status === 'PENDING' ? 'Telaah & Serahkan' : 'Lihat Rincian'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Telaah & Penyerahan */}
      {selectedPrescription && (
        <PrescriptionDispenseModal
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
          onSuccess={() => {
            setSelectedPrescription(null);
            loadPrescriptions();
          }}
        />
      )}
    </section>
  );
};
