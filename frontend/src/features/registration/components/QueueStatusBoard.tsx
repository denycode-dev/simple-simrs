import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

interface StatusConfigItem {
  label: string;
  variant: BadgeVariant;
  icon: string;
  nextStatus?: string;
  nextActionLabel?: string;
}

const STATUS_CONFIG: Record<string, StatusConfigItem> = {
  WAITING_NURSE: {
    label: 'Menunggu Skrining Nakes',
    variant: 'warning',
    icon: '⏳',
    nextStatus: 'IN_NURSE',
    nextActionLabel: 'Mulai Triage',
  },
  IN_NURSE: {
    label: 'Sedang Skrining Nakes',
    variant: 'info',
    icon: '🩺',
    nextStatus: 'WAITING_DOCTOR',
    nextActionLabel: 'Kirim ke Dokter',
  },
  WAITING_DOCTOR: {
    label: 'Menunggu Dokter Poli',
    variant: 'warning',
    icon: '👨‍⚕️',
    nextStatus: 'IN_DOCTOR',
    nextActionLabel: 'Mulai Konsultasi',
  },
  IN_DOCTOR: {
    label: 'Sedang Konsultasi Dokter',
    variant: 'info',
    icon: '💬',
    nextStatus: 'PHARMACY',
    nextActionLabel: 'Kirim ke Farmasi',
  },
  PHARMACY: {
    label: 'Antrean Resep Farmasi',
    variant: 'teal',
    icon: '💊',
    nextStatus: 'BILLING',
    nextActionLabel: 'Kirim ke Kasir',
  },
  BILLING: {
    label: 'Antrean Pembayaran Kasir',
    variant: 'warning',
    icon: '💳',
    nextStatus: 'COMPLETED',
    nextActionLabel: 'Selesaikan Tagihan',
  },
  COMPLETED: {
    label: 'Pelayanan Selesai',
    variant: 'success',
    icon: '✅',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    variant: 'danger',
    icon: '⛔',
  },
};

export const QueueStatusBoard: React.FC = () => {
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  // Auto-dismiss feedback after 4 seconds
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => {
      setFeedback(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleUpdateStatus = async (id: number, queueNumber: string, newStatus: string) => {
    setUpdatingId(id);
    setFeedback(null);
    try {
      await apiClient(`/registrations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      const newLabel = STATUS_CONFIG[newStatus]?.label || newStatus;
      setFeedback({
        type: 'success',
        message: `Status antrean ${queueNumber} berhasil dipindahkan ke: "${newLabel}".`,
      });
      await loadRegistrations();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal mengubah status antrean.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Metrik Ringkasan Antrean
  const counts = useMemo(() => ({
    ALL: registrations.length,
    WAITING_NURSE: registrations.filter((r) => r.status === 'WAITING_NURSE').length,
    WAITING_DOCTOR: registrations.filter((r) => r.status === 'WAITING_DOCTOR').length,
    PHARMACY: registrations.filter((r) => r.status === 'PHARMACY').length,
    BILLING: registrations.filter((r) => r.status === 'BILLING').length,
    COMPLETED: registrations.filter((r) => r.status === 'COMPLETED').length,
  }), [registrations]);

  const filteredItems = useMemo(() => {
    return registrations.filter((item) => {
      // 1. Filter status
      if (selectedFilter !== 'ALL' && item.status !== selectedFilter) {
        return false;
      }
      // 2. Filter search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchNumber = item.queue_number?.toLowerCase().includes(query);
        const matchName = item.patient?.name?.toLowerCase().includes(query);
        const matchRm = item.patient?.medical_record_number?.toLowerCase().includes(query);
        const matchPoli = item.polyclinic?.name?.toLowerCase().includes(query);
        const matchDoctor = item.doctor?.name?.toLowerCase().includes(query);
        return Boolean(matchNumber || matchName || matchRm || matchPoli || matchDoctor);
      }
      return true;
    });
  }, [registrations, selectedFilter, searchQuery]);

  const metricCards = [
    {
      id: 'WAITING_NURSE',
      label: 'Menunggu Triage',
      count: counts.WAITING_NURSE,
      icon: '⏳',
      color: 'var(--color-warning-text)',
      bg: 'var(--color-warning-bg)',
      border: 'var(--color-warning-border)',
    },
    {
      id: 'WAITING_DOCTOR',
      label: 'Menunggu Dokter',
      count: counts.WAITING_DOCTOR,
      icon: '👨‍⚕️',
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-light)',
      border: 'var(--color-primary-border)',
    },
    {
      id: 'PHARMACY',
      label: 'Antrean Farmasi',
      count: counts.PHARMACY,
      icon: '💊',
      color: 'var(--color-info-text)',
      bg: 'var(--color-info-bg)',
      border: 'var(--color-info-border)',
    },
    {
      id: 'BILLING',
      label: 'Antrean Kasir',
      count: counts.BILLING,
      icon: '💳',
      color: 'var(--color-warning-text)',
      bg: 'var(--color-warning-bg)',
      border: 'var(--color-warning-border)',
    },
    {
      id: 'COMPLETED',
      label: 'Selesai Layanan',
      count: counts.COMPLETED,
      icon: '✅',
      color: 'var(--color-success-text)',
      bg: 'var(--color-success-bg)',
      border: 'var(--color-success-border)',
    },
  ];

  return (
    <section aria-labelledby="queue-board-heading" style={{ maxWidth: '1280px', margin: '0 auto' }}>
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
              fontWeight: 800,
              color: 'var(--color-text-main)',
              letterSpacing: '-0.01em',
              margin: 0,
            }}
          >
            Papan Antrean Rawat Jalan
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: 0 }}>
            Live status antrean kunjungan pasien dari pendaftaran hingga kasir selesai.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Total Antrean Hari Ini: <strong>{registrations.length}</strong>
          </span>
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
      </div>

      {/* Baris Kartu Metrik Antrean Terpadu (Interaktif sebagai Filter Cepat) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
        }}
      >
        {metricCards.map((stat) => {
          const isSelected = selectedFilter === stat.id;
          return (
            <button
              key={stat.id}
              type="button"
              onClick={() => setSelectedFilter(isSelected ? 'ALL' : stat.id)}
              aria-pressed={isSelected}
              title={`Klik untuk memfilter antrean ${stat.label}`}
              style={{
                textAlign: 'left',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: isSelected ? stat.bg : 'var(--color-surface)',
                border: `2px solid ${isSelected ? stat.color : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)',
                boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                cursor: 'pointer',
                transition: 'all 160ms ease-in-out',
                position: 'relative',
                outline: 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {stat.label}
                </span>
                <span aria-hidden="true" style={{ fontSize: '1rem' }}>{stat.icon}</span>
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: 800, color: stat.color, marginTop: '4px', lineHeight: 1.1 }}>
                {stat.count}
              </div>
              <div style={{ fontSize: '0.6875rem', color: isSelected ? stat.color : 'var(--color-text-muted)', fontWeight: 600, marginTop: '4px' }}>
                {isSelected ? '✓ Sedang Memfilter' : 'Klik untuk filter'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Kontrol Filter & Pencarian Cepat */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        {/* Tab Filter Status */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { id: 'ALL', label: `Semua Antrean (${registrations.length})` },
            { id: 'WAITING_NURSE', label: 'Triage Nakes', icon: '⏳' },
            { id: 'WAITING_DOCTOR', label: 'Dokter Poli', icon: '👨‍⚕️' },
            { id: 'PHARMACY', label: 'Farmasi', icon: '💊' },
            { id: 'BILLING', label: 'Kasir', icon: '💳' },
            { id: 'COMPLETED', label: 'Selesai', icon: '✅' },
          ].map((tab) => {
            const isActive = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.4rem 0.875rem',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 700 : 500,
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  backgroundColor: isActive ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 140ms ease',
                }}
              >
                {tab.icon && <span aria-hidden="true" style={{ fontSize: '0.75rem' }}>{tab.icon}</span>}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Kotak Pencarian Pasien / No Antrean */}
        <div style={{ minWidth: '260px', flex: '0 1 320px' }}>
          <label htmlFor="queue-search-input" className="sr-only">
            Cari Antrean
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="queue-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no. antrean, RM, nama pasien..."
              style={{
                width: '100%',
                padding: '0.45rem 2rem 0.45rem 0.75rem',
                fontSize: '0.8125rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-main)',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Hapus pencarian"
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Umpan Balik Langsung Transisi Status (Non-blocking Alert) */}
      {feedback && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert
            variant={feedback.type === 'success' ? 'success' : 'danger'}
            title={feedback.type === 'success' ? 'Pembaruan Status Berhasil' : 'Gagal Memperbarui Status'}
          >
            {feedback.message}
          </Alert>
        </div>
      )}

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
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: 'var(--color-text-secondary)', width: '130px' }}>No. Antrean</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: 'var(--color-text-secondary)', minWidth: '220px' }}>Nama Pasien & No. RM</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: 'var(--color-text-secondary)', width: '200px' }}>Poli & Dokter DPJP</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: 'var(--color-text-secondary)', width: '140px' }}>Penjamin</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: 'var(--color-text-secondary)', width: '220px' }}>Status Saat Ini</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: 'var(--color-text-secondary)', width: '180px', textAlign: 'center' }}>Aksi Transisi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <div style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>⏳</div>
                    <div>Memuat status live antrean rawat jalan...</div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📋</div>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-main)', fontSize: '1rem' }}>
                      Tidak ada antrean pada kategori ini
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      {searchQuery
                        ? `Tidak ditemukan antrean yang cocok dengan kata kunci "${searchQuery}".`
                        : 'Belum ada pasien yang terdaftar dalam antrean ini hari ini.'}
                    </p>
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        label="Hapus Filter Pencarian"
                        onClick={() => setSearchQuery('')}
                      />
                    )}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const cfg = STATUS_CONFIG[item.status] || {
                    label: item.status,
                    variant: 'neutral' as BadgeVariant,
                    icon: '•',
                  };
                  const isUpdating = updatingId === item.id;
                  const isBpjs = item.insurance_type === 'BPJS';

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--color-border-subtle)',
                        backgroundColor: isUpdating ? 'var(--color-surface-hover)' : 'transparent',
                        transition: 'background-color 150ms ease',
                      }}
                    >
                      {/* Nomor Antrean (Paling Mencolok) */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 900,
                            fontSize: '1rem',
                            color: 'var(--color-primary-dark)',
                            backgroundColor: 'var(--color-primary-light)',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1.5px solid var(--color-primary-border)',
                            display: 'inline-block',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {item.queue_number}
                        </span>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          Urutan #{item.queue_sequence}
                        </div>
                      </td>

                      {/* Nama Pasien & No. RM */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-main)', fontSize: '0.9375rem' }}>
                          {item.patient?.name || `Pasien #${item.id}`}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            color: 'var(--color-primary)',
                            fontWeight: 600,
                            marginTop: '2px',
                          }}
                        >
                          RM: {item.patient?.medical_record_number || '-'}
                        </div>
                      </td>

                      {/* Poli & Dokter */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                          {item.polyclinic?.name || 'Poliklinik'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                          {item.doctor?.name || 'Dokter DPJP'}
                        </div>
                      </td>

                      {/* Penjamin (Dual Cues: Ikon + Badge Label) */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span aria-hidden="true" style={{ fontSize: '0.8125rem' }}>{isBpjs ? '🛡️' : '💵'}</span>
                          <Badge
                            variant={isBpjs ? 'success' : 'info'}
                            label={isBpjs ? 'BPJS' : 'Umum (Cash)'}
                          />
                        </span>
                      </td>

                      {/* Status Saat Ini (Dual Cues: Ikon + Badge Label) */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span aria-hidden="true">{cfg.icon}</span>
                          <Badge variant={cfg.variant} label={cfg.label} />
                        </span>
                      </td>

                      {/* Aksi Transisi */}
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                        {cfg.nextStatus ? (
                          <Button
                            variant="primary"
                            size="sm"
                            label={isUpdating ? 'Memproses...' : (cfg.nextActionLabel || 'Lanjut')}
                            onClick={() => handleUpdateStatus(item.id, item.queue_number, cfg.nextStatus!)}
                            isLoading={isUpdating}
                            disabled={isUpdating}
                          >
                            {isUpdating ? 'Memproses...' : (cfg.nextActionLabel || 'Lanjut')}
                          </Button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                            {item.status === 'COMPLETED' ? '✓ Selesai' : '-'}
                          </span>
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
