import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Alert, Badge, type BadgeVariant } from '@/components/ui';
import { apiClient } from '@/lib/api-client';

export interface RegistrationItem {
  id: number;
  queue_number: string;
  queue_sequence: number;
  insurance_type: 'GENERAL' | 'BPJS';
  registration_date: string;
  status: 'WAITING_NURSE' | 'IN_NURSE' | 'WAITING_DOCTOR' | 'IN_DOCTOR' | 'PHARMACY' | 'BILLING' | 'COMPLETED' | 'CANCELLED';
  patient?: {
    id: number;
    name: string;
    medical_record_number: string;
  };
  polyclinic?: {
    id: number;
    name: string;
  };
  doctor?: {
    id: number;
    name: string;
  };
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: BadgeVariant; nextStatus?: string; nextActionLabel?: string }
> = {
  WAITING_NURSE: {
    label: 'Menunggu Skrining Nakes',
    variant: 'warning',
    nextStatus: 'IN_NURSE',
    nextActionLabel: 'Mulai Triage',
  },
  IN_NURSE: {
    label: 'Sedang Skrining Nakes',
    variant: 'info',
    nextStatus: 'WAITING_DOCTOR',
    nextActionLabel: 'Kirim ke Dokter',
  },
  WAITING_DOCTOR: {
    label: 'Menunggu Dokter Poli',
    variant: 'warning',
    nextStatus: 'IN_DOCTOR',
    nextActionLabel: 'Mulai Konsultasi',
  },
  IN_DOCTOR: {
    label: 'Sedang Konsultasi Dokter',
    variant: 'info',
    nextStatus: 'PHARMACY',
    nextActionLabel: 'Kirim ke Farmasi',
  },
  PHARMACY: {
    label: 'Antrean Resep Farmasi',
    variant: 'teal',
    nextStatus: 'BILLING',
    nextActionLabel: 'Kirim ke Kasir',
  },
  BILLING: {
    label: 'Antrean Pembayaran Kasir',
    variant: 'warning',
    nextStatus: 'COMPLETED',
    nextActionLabel: 'Selesaikan Tagihan',
  },
  COMPLETED: {
    label: 'Pelayanan Selesai',
    variant: 'success',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    variant: 'danger',
  },
};

export const QueueStatusBoard: React.FC = () => {
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadRegistrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient<{ success: boolean; data: RegistrationItem[] }>('/registrations');
      setRegistrations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat papan antrean pasien.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      await apiClient(`/registrations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await loadRegistrations();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah status antrean.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredItems = registrations.filter((item) => {
    if (selectedFilter === 'ALL') return true;
    return item.status === selectedFilter;
  });

  // Metrik Ringkasan Antrean
  const counts = {
    WAITING_NURSE: registrations.filter((r) => r.status === 'WAITING_NURSE').length,
    WAITING_DOCTOR: registrations.filter((r) => r.status === 'WAITING_DOCTOR').length,
    PHARMACY: registrations.filter((r) => r.status === 'PHARMACY').length,
    BILLING: registrations.filter((r) => r.status === 'BILLING').length,
    COMPLETED: registrations.filter((r) => r.status === 'COMPLETED').length,
  };

  return (
    <section aria-labelledby="queue-board-heading">
      {/* Header Halaman */}
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
            id="queue-board-heading"
            style={{
              fontSize: '1.375rem',
              fontWeight: 700,
              color: 'var(--color-text-main)',
              letterSpacing: '-0.01em',
            }}
          >
            Papan Antrean Rawat Jalan
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Live status antrean kunjungan pasien dari pendaftaran hingga kasir selesai.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          label="Segarkan Antrean"
          onClick={loadRegistrations}
          isLoading={isLoading}
        >
          Segarkan Antrean
        </Button>
      </div>

      {/* Baris Kartu Metrik Antrean Terpadu */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
        }}
      >
        {[
          { label: 'Menunggu Triage', count: counts.WAITING_NURSE, color: 'var(--color-warning-text)', bg: 'var(--color-warning-bg)' },
          { label: 'Menunggu Dokter', count: counts.WAITING_DOCTOR, color: 'var(--color-primary)', bg: 'var(--color-primary-light)' },
          { label: 'Antrean Farmasi', count: counts.PHARMACY, color: 'var(--color-info-text)', bg: 'var(--color-info-bg)' },
          { label: 'Antrean Kasir', count: counts.BILLING, color: 'var(--color-warning-text)', bg: 'var(--color-warning-bg)' },
          { label: 'Selesai Layanan', count: counts.COMPLETED, color: 'var(--color-success-text)', bg: 'var(--color-success-bg)' },
        ].map((stat, i) => (
          <Card key={i} elevation="low" padding={3} style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stat.color, marginTop: '2px' }}>
              {stat.count}
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Status Antrean */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        {[
          { id: 'ALL', label: `Semua Antrean (${registrations.length})` },
          { id: 'WAITING_NURSE', label: 'Triage Nakes' },
          { id: 'WAITING_DOCTOR', label: 'Dokter Poli' },
          { id: 'PHARMACY', label: 'Farmasi' },
          { id: 'BILLING', label: 'Kasir' },
          { id: 'COMPLETED', label: 'Selesai' },
        ].map((tab) => {
          const isActive = selectedFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFilter(tab.id)}
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

      {/* Error Alert */}
      {error && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="danger" title="Gagal Memuat Antrean">{error}</Alert>
        </div>
      )}

      {/* Tabel Live Board */}
      <Card elevation="low" padding={0} style={{ overflow: 'hidden', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '120px' }}>No. Antrean</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', minWidth: '220px' }}>Nama Pasien & No. RM</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '180px' }}>Poli & Dokter</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '140px' }}>Penjamin</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '220px' }}>Status Saat Ini</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '180px', textAlign: 'center' }}>Aksi Transisi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Memuat status live antrean...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📋</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Tidak ada antrean pada kategori ini</div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const cfg = STATUS_CONFIG[item.status] || { label: item.status, variant: 'neutral' };
                  const isUpdating = updatingId === item.id;

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: '0.9375rem',
                            color: 'var(--color-primary)',
                            backgroundColor: 'var(--color-primary-light)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-primary-border)',
                            display: 'inline-block',
                          }}
                        >
                          {item.queue_number}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
                          {item.patient?.name || `Pasien #${item.id}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {item.patient?.medical_record_number || '-'}
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                          {item.polyclinic?.name || 'Poliklinik'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {item.doctor?.name || 'Dokter DPJP'}
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <Badge
                          variant={item.insurance_type === 'BPJS' ? 'success' : 'info'}
                          label={item.insurance_type === 'BPJS' ? 'BPJS' : 'Umum (Cash)'}
                        />
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <Badge variant={cfg.variant} label={cfg.label} />
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                        {cfg.nextStatus ? (
                          <Button
                            variant="primary"
                            size="sm"
                            label={cfg.nextActionLabel || 'Lanjut'}
                            onClick={() => handleUpdateStatus(item.id, cfg.nextStatus!)}
                            isLoading={isUpdating}
                          >
                            {cfg.nextActionLabel || 'Lanjut'}
                          </Button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
};
