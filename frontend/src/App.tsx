import { Theme } from '@astryxdesign/core/theme';
import { themes, defaultThemeSlug } from './astryx-themes';
import { useState, useMemo } from 'react';
import { DashboardLayout, type BreadcrumbItem } from '@/components/layout';
import { useAuth, LoginForm, UserProfile } from '@/features/auth';
import {
  usePatients,
  PatientTable,
  type Patient,
} from '@/features/patients';
import {
  MasterPatientsPage,
  MasterMedicinesPage,
  MasterDoctorsPage,
} from '@/features/master';
import { RegistrationForm, QueueStatusBoard } from '@/features/registration';
import { NurseQueueList } from '@/features/nurse';
import { DoctorExaminationForm } from '@/features/examination';
import { PrescriptionQueueTable } from '@/features/pharmacy';
import { LaboratoryPage } from '@/features/laboratory';
import { BillingPage } from '@/features/billing';
import { DashboardAnalyticsPage } from '@/features/dashboard';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import type { MenuItem } from '@/config/dashboard-menu';

export function App() {
  const { user, isAuthenticated, isLoading: isAuthLoading, error: authError, login, logout } = useAuth();
  const {
    patients,
    isLoading: isPatientsLoading,
    updateStatus,
    refresh,
  } = usePatients();

  // Active navigation state in dashboard
  const [activeMenuId, setActiveMenuId] = useState('patient-all');
  const [activeMenuTitle, setActiveMenuTitle] = useState('Semua Pasien');
  const [breadcrumbTrail, setBreadcrumbTrail] = useState<BreadcrumbItem[]>([
    { label: 'Layanan Pasien' },
    { label: 'Pendaftaran & Antrean' },
    { label: 'Semua Pasien' },
  ]);

  // Selected patient for modal detail
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const handleSelectMenu = (item: MenuItem, parentGroupTitle?: string) => {
    setActiveMenuId(item.id);
    setActiveMenuTitle(item.title);

    // Build breadcrumb trail dynamically
    const trail: BreadcrumbItem[] = [];
    if (parentGroupTitle) {
      trail.push({ label: parentGroupTitle });
    }
    trail.push({ label: item.title });
    setBreadcrumbTrail(trail);

    // Filter patients based on sub-route if in patient domain
    if (item.id === 'patient-all') {
      updateStatus('all');
    } else if (item.id === 'patient-outpatient') {
      updateStatus('Rawat Jalan');
    } else if (item.id === 'patient-inpatient') {
      updateStatus('Rawat Inap');
    } else if (item.id === 'patient-emergency') {
      updateStatus('IGD');
    }
  };

  const isPatientDomain = useMemo(() => {
    return activeMenuId.startsWith('patient-') || activeMenuId === 'patients';
  }, [activeMenuId]);

  // Auth screen
  if (!isAuthenticated) {
    return (
      <Theme theme={themes[defaultThemeSlug]} mode="light">
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
            backgroundColor: 'var(--color-bg)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-inverse)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.75rem',
                marginBottom: 'var(--space-3)',
                boxShadow: 'var(--shadow-md)',
              }}
              aria-hidden="true"
            >
              +
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
              Simple SIMRS
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              Sistem Informasi Manajemen Rumah Sakit Modern
            </p>
          </div>

          <LoginForm
            onSubmit={login}
            isLoading={isAuthLoading}
            serverError={authError}
          />
        </div>
      </Theme>
    );
  }

  return (
    <Theme theme={themes[defaultThemeSlug]} mode="light">
      <DashboardLayout
        activeMenuId={activeMenuId}
        onSelectMenu={handleSelectMenu}
        breadcrumbItems={breadcrumbTrail}
        userSlot={
          user && <UserProfile user={user} onLogout={logout} isLoading={isAuthLoading} />
        }
      >
        {activeMenuId === 'dashboard-analytics' ? (
          <DashboardAnalyticsPage />
        ) : activeMenuId === 'billing' ? (
          <BillingPage />
        ) : activeMenuId === 'laboratory' ? (
          <LaboratoryPage />
        ) : activeMenuId === 'pharmacy-prescriptions' ? (
          <PrescriptionQueueTable />
        ) : activeMenuId === 'doctor-consultation' ? (
          <DoctorExaminationForm />
        ) : activeMenuId === 'nurse-triage' ? (
          <NurseQueueList />
        ) : activeMenuId === 'reg-new' ? (
          <RegistrationForm />
        ) : activeMenuId === 'reg-live-board' ? (
          <QueueStatusBoard />
        ) : activeMenuId === 'master-patients' ? (
          <MasterPatientsPage />
        ) : activeMenuId === 'master-medicines' || activeMenuId === 'master-medicines-alt' ? (
          <MasterMedicinesPage />
        ) : activeMenuId === 'master-doctors' ? (
          <MasterDoctorsPage />
        ) : isPatientDomain ? (
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
                  {activeMenuTitle}
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Daftar antrean pasien aktif dengan filter layanan dan fitur rekam medis elektronik.
                </p>
              </div>

              {/* Status Quick Filter Chips */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {[
                  { id: 'patient-all', label: 'Semua Status', status: 'all' },
                  { id: 'patient-outpatient', label: 'Rawat Jalan', status: 'Rawat Jalan' },
                  { id: 'patient-inpatient', label: 'Rawat Inap', status: 'Rawat Inap' },
                  { id: 'patient-emergency', label: 'IGD', status: 'IGD' },
                ].map((tab) => {
                  const isActive = activeMenuId === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveMenuId(tab.id);
                        setActiveMenuTitle(tab.label);
                        updateStatus(tab.status);
                      }}
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
              isLoading={isPatientsLoading}
              onSelectPatient={setSelectedPatient}
              onRefresh={refresh}
            />

            {/* Modal Detail Rekam Medis Pasien Terpilih */}
            {selectedPatient && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-patient-title"
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'var(--space-4)',
                  zIndex: 60,
                }}
                onClick={() => setSelectedPatient(null)}
              >
                <div
                  style={{ maxWidth: '520px', width: '100%' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Card
                    elevation="high"
                    padding={6}
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  >
                    <CardHeader style={{ paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.8125rem',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: 'var(--color-primary)',
                            backgroundColor: 'var(--color-primary-light)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          {selectedPatient.medicalRecordNumber}
                        </span>
                        <Badge variant="primary" label={selectedPatient.status} />
                      </div>
                      <CardTitle id="modal-patient-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: 'var(--space-2)' }}>
                        {selectedPatient.name}
                      </CardTitle>
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        {selectedPatient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}, {selectedPatient.age} tahun
                      </span>
                    </CardHeader>
                    <CardContent style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                      <div>
                        <strong style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Diagnosis Utama:
                        </strong>
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)', marginTop: '2px', display: 'block' }}>
                          {selectedPatient.diagnosis}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', padding: 'var(--space-3)', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)' }}>
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
                          <span style={{ fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                            {selectedPatient.bpjsNumber}
                          </span>
                        </div>
                      )}
                    </CardContent>
                    <div style={{ paddingTop: 'var(--space-5)', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="secondary" size="md" onClick={() => setSelectedPatient(null)}>
                        Tutup
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </section>
        ) : (
          /* Placeholder modul menu lain */
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--space-12) var(--space-6)',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }} aria-hidden="true">
              📋
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              Modul: {activeMenuTitle}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', maxWidth: '520px', margin: 'var(--space-2) auto' }}>
              Modul layanan terintegrasi SIMRS Rawat Jalan.
            </p>
            <div style={{ marginTop: 'var(--space-4)' }}>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setActiveMenuId('patient-all');
                  setActiveMenuTitle('Semua Pasien');
                  setBreadcrumbTrail([
                    { label: 'Layanan Pasien' },
                    { label: 'Pendaftaran & Antrean' },
                    { label: 'Semua Pasien' },
                  ]);
                }}
              >
                Kembali ke Data Pasien
              </Button>
            </div>
          </div>
        )}
      </DashboardLayout>
    </Theme>
  );
}

export default App;
