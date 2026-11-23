import React from 'react';
import { Alert, Button } from '@/components/ui';
import { PatientCard } from './PatientCard';
import type { Patient } from '../types';

export interface PatientListProps {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectPatient?: (patient: Patient) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  isLoading,
  error,
  onRetry,
  onSelectPatient,
}) => {
  if (isLoading) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 'var(--space-5)',
        }}
        aria-label="Memuat daftar pasien..."
        aria-busy="true"
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: '200px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              padding: 'var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              boxShadow: 'var(--shadow-sm)',
              opacity: 0.7,
            }}
          >
            <div style={{ height: '18px', width: '35%', backgroundColor: 'var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }} />
            <div style={{ height: '24px', width: '65%', backgroundColor: 'var(--color-border-subtle)', borderRadius: 'var(--radius-sm)' }} />
            <div style={{ height: '16px', width: '90%', backgroundColor: 'var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', marginTop: 'auto' }} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" title="Gagal Memuat Pasien">
        <p>{error}</p>
        <div style={{ marginTop: 'var(--space-3)' }}>
          <Button variant="danger" size="sm" onClick={onRetry}>
            Coba Lagi
          </Button>
        </div>
      </Alert>
    );
  }

  if (patients.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 'var(--space-12) var(--space-6)',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }} aria-hidden="true">
          🏥
        </div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
          Tidak Ada Data Pasien
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
          Tidak ada pasien yang sesuai dengan filter pencarian Anda saat ini.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 'var(--space-5)',
      }}
    >
      {patients.map((patient) => (
        <PatientCard key={patient.id} patient={patient} onSelect={onSelectPatient} />
      ))}
    </div>
  );
};
