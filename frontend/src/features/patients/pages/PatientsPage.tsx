import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePatients } from '../hooks/usePatients';
import { PatientTable } from '../components/PatientTable';
import type { Patient } from '../types';
import { CardContent, Button, Badge } from '@/components/ui';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';

const FILTER_TABS = [
  { id: 'patient-all', label: 'Semua Status', status: 'all' },
  { id: 'patient-outpatient', label: 'Rawat Jalan', status: 'Rawat Jalan' },
  { id: 'patient-inpatient', label: 'Rawat Inap', status: 'Rawat Inap' },
  { id: 'patient-emergency', label: 'IGD', status: 'IGD' },
] as const;

export const PatientsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    patients,
    isLoading,
    updateStatus,
    refresh,
  } = usePatients();

  // Selected patient for modal detail
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Sync status from URL query param
  const statusParam = searchParams.get('status') || 'all';

  useEffect(() => {
    updateStatus(statusParam);
  }, [statusParam, updateStatus]);

  const activeTab = FILTER_TABS.find((t) => t.status === statusParam) || FILTER_TABS[0];

  const handleTabChange = (status: string) => {
    if (status === 'all') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ status }, { replace: true });
    }
    updateStatus(status);
  };

  return (
    <section aria-labelledby="dashboard-content-heading">
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-5)',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div>
          <h2
            id="dashboard-content-heading"
            style={{
              fontSize: '1.375rem',
              fontWeight: 700,
              color: 'var(--color-text-main)',
              letterSpacing: '-0.01em',
            }}
          >
            {activeTab.label === 'Semua Status' ? 'Semua Pasien' : activeTab.label}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Daftar antrean pasien aktif dengan filter layanan dan fitur rekam medis elektronik.
          </p>
        </div>

        {/* Status Quick Filter Chips */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {FILTER_TABS.map((tab) => {
            const isActive = statusParam === tab.status;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.status)}
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
      </div>

      {/* Reusable DataTable with Sticky Header & Sticky Action Column */}
      <PatientTable
        patients={patients}
        isLoading={isLoading}
        onSelectPatient={setSelectedPatient}
        onRefresh={refresh}
      />

      {/* Modal Detail Rekam Medis Pasien Terpilih */}
      {selectedPatient && (
        <Dialog
          isOpen={Boolean(selectedPatient)}
          onOpenChange={(open) => {
            if (!open) setSelectedPatient(null);
          }}
          width={560}
          purpose="info"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-patient-title"
        >
          <div className="p-6 bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <DialogHeader
              title={
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono font-bold text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {selectedPatient.medicalRecordNumber}
                    </span>
                    <Badge variant="teal" label={selectedPatient.status} />
                  </div>
                  <h2 id="modal-patient-title" className="text-xl font-bold text-slate-900 mt-1">
                    {selectedPatient.name}
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedPatient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}, {selectedPatient.age} tahun
                  </span>
                </div>
              }
              onOpenChange={() => setSelectedPatient(null)}
            />
            <CardContent style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <strong
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    display: 'block',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Diagnosis Utama:
                </strong>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--color-text-main)',
                    marginTop: '2px',
                    display: 'block',
                  }}
                >
                  {selectedPatient.diagnosis}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--color-surface-hover)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                    Dokter Penanggung Jawab:
                  </strong>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    {selectedPatient.doctorName}
                  </span>
                </div>
                <div>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                    Ruangan / Poli:
                  </strong>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    {selectedPatient.room || '-'}
                  </span>
                </div>
              </div>

              {selectedPatient.bpjsNumber && (
                <div>
                  <strong style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                    Nomor BPJS Kesehatan:
                  </strong>
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {selectedPatient.bpjsNumber}
                  </span>
                </div>
              )}
            </CardContent>
            <div
              style={{
                paddingTop: 'var(--space-5)',
                marginTop: 'var(--space-4)',
                borderTop: '1px solid var(--color-border-subtle)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Button variant="secondary" size="md" onClick={() => setSelectedPatient(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </section>
  );
};
