import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';

export interface NurseAssessmentData {
  id: number;
  weight_kg: number;
  height_cm: number;
  systolic: number;
  diastolic: number;
  pulse_rate: number;
  body_temp: number;
  respiratory_rate: number;
  chief_complaint: string;
  allergy_history: string;
  disease_history?: string;
  notes?: string;
}

export interface InitialAssessmentCardProps {
  assessment: NurseAssessmentData;
}

export const InitialAssessmentCard: React.FC<InitialAssessmentCardProps> = ({ assessment }) => {
  const hasAllergy =
    assessment.allergy_history &&
    !assessment.allergy_history.toLowerCase().includes('tidak') &&
    !assessment.allergy_history.toLowerCase().includes('nihil');

  const bmi =
    assessment.height_cm > 0
      ? (assessment.weight_kg / Math.pow(assessment.height_cm / 100, 2)).toFixed(1)
      : '-';

  return (
    <Card
      elevation="low"
      padding={4}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--space-4)',
      }}
    >
      <CardHeader style={{ paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <CardTitle style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span>🩺</span> Informasi Skrining Awal Nakes (Triage)
        </CardTitle>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Data Awal Sebelum Konsultasi Dokter
        </span>
      </CardHeader>

      <CardContent style={{ padding: 'var(--space-3) 0 0 0' }}>
        {/* Banner TTV & Antropometri dalam Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-3)',
          }}
        >
          <div style={{ backgroundColor: 'var(--color-surface-hover)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Tekanan Darah</span>
            <strong style={{ fontSize: '1rem', color: 'var(--color-text-main)' }}>
              {assessment.systolic}/{assessment.diastolic} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>mmHg</span>
            </strong>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface-hover)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Nadi</span>
            <strong style={{ fontSize: '1rem', color: 'var(--color-text-main)' }}>
              {assessment.pulse_rate} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>x/mnt</span>
            </strong>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface-hover)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Suhu Tubuh</span>
            <strong style={{ fontSize: '1rem', color: 'var(--color-text-main)' }}>
              {assessment.body_temp} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>°C</span>
            </strong>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface-hover)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Pernapasan (RR)</span>
            <strong style={{ fontSize: '1rem', color: 'var(--color-text-main)' }}>
              {assessment.respiratory_rate} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>x/mnt</span>
            </strong>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface-hover)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>BB / TB / BMI</span>
            <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text-main)' }}>
              {assessment.weight_kg}kg / {assessment.height_cm}cm ({bmi})
            </strong>
          </div>
        </div>

        {/* Keluhan & Alergi Alerts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--color-surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
            <strong style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', textTransform: 'uppercase' }}>
              Keluhan Utama Pasien:
            </strong>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', marginTop: '4px', margin: '4px 0 0 0' }}>
              {assessment.chief_complaint}
            </p>
          </div>

          <div
            style={{
              padding: 'var(--space-3)',
              backgroundColor: hasAllergy ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${hasAllergy ? 'var(--color-danger-border)' : 'var(--color-success-border)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong
                style={{
                  fontSize: '0.75rem',
                  color: hasAllergy ? 'var(--color-danger-text)' : 'var(--color-success-text)',
                  textTransform: 'uppercase',
                }}
              >
                ⚠️ Riwayat Alergi:
              </strong>
              <Badge
                variant={hasAllergy ? 'danger' : 'success'}
                label={hasAllergy ? 'Peringatan Alergi' : 'Alergi Negatif'}
              />
            </div>
            <p
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: hasAllergy ? 'var(--color-danger-text)' : 'var(--color-success-text)',
                marginTop: '4px',
                margin: '4px 0 0 0',
              }}
            >
              {assessment.allergy_history || 'Tidak ada riwayat alergi dilaporkan'}
            </p>
          </div>
        </div>

        {assessment.disease_history && (
          <div style={{ marginTop: 'var(--space-2)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            <strong>Riwayat Penyakit Terdahulu:</strong> {assessment.disease_history}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
