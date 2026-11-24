import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Alert, Badge } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import { NurseAssessmentForm, type NurseAssessmentRegistration } from './NurseAssessmentForm';

interface RegistrationItem extends NurseAssessmentRegistration {
  insurance_type: 'GENERAL' | 'BPJS';
  registration_date: string;
  status: 'WAITING_NURSE' | 'IN_NURSE' | 'WAITING_DOCTOR' | 'IN_DOCTOR' | 'PHARMACY' | 'BILLING' | 'COMPLETED' | 'CANCELLED';
}

export const NurseQueueList: React.FC = () => {
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePatient, setActivePatient] = useState<RegistrationItem | null>(null);

  const loadTriageQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient<{ success: boolean; data: RegistrationItem[] }>('/registrations');
      // Filter hanya yang sedang atau menunggu di triage nakes
      const triageList = (Array.isArray(res.data) ? res.data : []).filter(
        (r) => r.status === 'WAITING_NURSE' || r.status === 'IN_NURSE'
      );
      setRegistrations(triageList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat antrean triage keperawatan.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTriageQueue();
  }, [loadTriageQueue]);

  const handleStartAssessment = async (item: RegistrationItem) => {
    if (item.status === 'WAITING_NURSE') {
      try {
        await apiClient(`/registrations/${item.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'IN_NURSE' }),
        });
      } catch {
        // Abaikan jika error minor
      }
    }
    setActivePatient(item);
  };

  if (activePatient) {
    return (
      <NurseAssessmentForm
        registration={activePatient}
        onComplete={() => {
          setActivePatient(null);
          loadTriageQueue();
        }}
        onCancel={() => setActivePatient(null)}
      />
    );
  }

  return (
    <section aria-labelledby="nurse-queue-heading">
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
            id="nurse-queue-heading"
            style={{
              fontSize: '1.375rem',
              fontWeight: 700,
              color: 'var(--color-text-main)',
              letterSpacing: '-0.01em',
            }}
          >
            Antrean Skrining Keperawatan (Ruang Triage)
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Daftar pasien menunggu pemeriksaan awal tanda-tanda vital sebelum memasuki ruang periksa dokter.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          label="Segarkan Antrean"
          onClick={loadTriageQueue}
          isLoading={isLoading}
        >
          Segarkan Antrean
        </Button>
      </div>

      {error && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="danger" title="Gagal Memuat Antrean">{error}</Alert>
        </div>
      )}

      <Card elevation="low" padding={0} style={{ overflow: 'hidden', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-hover)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '120px' }}>No. Antrean</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', minWidth: '220px' }}>Nama Pasien & No. RM</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '180px' }}>Poliklinik Tujuan</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '160px' }}>Dokter DPJP</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '140px' }}>Penjamin</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '160px' }}>Status</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, color: 'var(--color-text-secondary)', width: '180px', textAlign: 'center' }}>Aksi Triage</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Memuat daftar pasien triage...
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🩺</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Tidak ada pasien menunggu di ruang triage</div>
                    <div style={{ fontSize: '0.8125rem', marginTop: 'var(--space-1)' }}>
                      Pasien yang baru mendaftar di loket akan otomatis muncul pada daftar ini.
                    </div>
                  </td>
                </tr>
              ) : (
                registrations.map((item) => (
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
                        {item.patient?.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {item.patient?.medical_record_number}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      {item.polyclinic?.name}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                      {item.doctor?.name}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <Badge
                        variant={item.insurance_type === 'BPJS' ? 'success' : 'info'}
                        label={item.insurance_type === 'BPJS' ? 'BPJS' : 'Umum (Cash)'}
                      />
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <Badge
                        variant={item.status === 'IN_NURSE' ? 'info' : 'warning'}
                        label={item.status === 'IN_NURSE' ? 'Sedang Diperiksa' : 'Menunggu Dipanggil'}
                      />
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'center' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        label={item.status === 'IN_NURSE' ? 'Lanjutkan Skrining' : 'Panggil Pasien'}
                        onClick={() => handleStartAssessment(item)}
                      >
                        {item.status === 'IN_NURSE' ? 'Lanjutkan Skrining' : 'Panggil Pasien'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
};
