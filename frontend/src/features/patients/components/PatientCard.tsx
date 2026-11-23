import React from 'react';
import { Badge, Card, CardContent, CardHeader, CardTitle, type BadgeVariant } from '@/components/ui';
import { formatDate } from '@/utils/formatters';
import type { Patient, PatientStatus } from '../types';

export interface PatientCardProps {
  patient: Patient;
  onSelect?: (patient: Patient) => void;
}

const getStatusBadgeVariant = (status: PatientStatus): BadgeVariant => {
  switch (status) {
    case 'Rawat Inap':
      return 'warning';
    case 'IGD':
      return 'danger';
    case 'Rawat Jalan':
      return 'info';
    case 'Selesai':
    default:
      return 'success';
  }
};

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onSelect }) => {
  return (
    <Card
      elevation="low"
      padding={5}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
        cursor: onSelect ? 'pointer' : 'default',
      }}
      onClick={() => onSelect?.(patient)}
    >
      <CardHeader style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div>
          <span
            style={{
              fontSize: '0.8125rem',
              fontFamily: 'monospace',
              fontWeight: 700,
              color: 'var(--color-primary)',
              backgroundColor: 'var(--color-primary-light)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-primary-border)',
            }}
          >
            {patient.medicalRecordNumber}
          </span>
          <CardTitle style={{ marginTop: 'var(--space-2)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
            {patient.name}
          </CardTitle>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}, {patient.age} tahun
          </span>
        </div>
        <Badge variant={getStatusBadgeVariant(patient.status)} label={patient.status} />
      </CardHeader>

      <CardContent style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Diagnosis Utama
          </div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-main)', marginTop: '2px' }}>
            {patient.diagnosis}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-3)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--color-border-subtle)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Dokter DPJP:</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {patient.doctorName}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Ruang / Poli:</div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {patient.room || '-'}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
          Masuk: <strong>{formatDate(patient.admissionDate)}</strong>
        </div>
      </CardContent>
    </Card>
  );
};
