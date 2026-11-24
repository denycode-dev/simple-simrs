import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { Button } from '@/components/ui';

export interface ForbiddenPageProps {
  requiredRoles?: string[];
  userRole?: string;
  moduleTitle?: string;
}

export const ForbiddenPage: React.FC<ForbiddenPageProps> = ({
  requiredRoles,
  userRole: propUserRole,
  moduleTitle,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const activeRole = propUserRole || user?.role || 'Guest';

  const roleLabels: Record<string, string> = {
    admin: 'Administrator Sistem',
    registration: 'Petugas Pendaftaran',
    nurse: 'Perawat / Nakes',
    doctor: 'Dokter Poliklinik',
    pharmacist: 'Petugas Farmasi',
    lab: 'Petugas Laboratorium',
    cashier: 'Petugas Kasir',
  };

  const currentRoleLabel = roleLabels[activeRole] || activeRole;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 'var(--space-8) var(--space-4)',
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          textAlign: 'center',
          backgroundColor: 'var(--color-surface)',
          padding: 'var(--space-8)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-danger-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto var(--space-4)',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-danger-bg)',
            color: 'var(--color-danger-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-hidden="true"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <span
          style={{
            display: 'inline-block',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--color-danger-text)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 'var(--space-2)',
          }}
        >
          Akses Ditolak (403 Forbidden)
        </span>

        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--color-text-main)',
            marginBottom: 'var(--space-3)',
            letterSpacing: '-0.02em',
          }}
        >
          Izin Akses Tidak Memadai
        </h1>

        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            marginBottom: 'var(--space-4)',
          }}
        >
          Akun Anda login sebagai <strong>{currentRoleLabel}</strong> ({activeRole}).
          {moduleTitle ? ` Modul "${moduleTitle}"` : ' Modul ini'} dilindungi oleh kebijakan keamanan RBAC
          dan hanya dapat dibuka oleh peran tertentu
          {requiredRoles && requiredRoles.length > 0 ? ` (${requiredRoles.join(', ')})` : ''}.
        </p>

        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-6)',
          }}
        >
          Jika Anda memerlukan wewenang klinis atau administratif untuk modul ini, silakan hubungi Administrator SIMRS.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/patients')}
          >
            Kembali ke Data Pasien
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            Ganti Akun / Logout
          </Button>
        </div>
      </div>
    </div>
  );
};
