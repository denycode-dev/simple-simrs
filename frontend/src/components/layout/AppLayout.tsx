import React from 'react';
import { Badge } from '@/components/ui';

export interface AppLayoutProps {
  children: React.ReactNode;
  userSlot?: React.ReactNode;
  activeNav?: string;
  onNavChange?: (nav: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  userSlot,
  activeNav = 'patients',
  onNavChange,
}) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text-main)',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: 'var(--space-4) var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-inverse)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.25rem',
                boxShadow: 'var(--shadow-sm)',
              }}
              aria-hidden="true"
            >
              +
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <h1
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: 'var(--color-text-main)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  SIMRS Inova Medika
                </h1>
                <Badge variant="primary" label="v1.0" />
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Sistem Informasi Manajemen Rumah Sakit
              </p>
            </div>
          </div>

          {/* User Profile Slot */}
          {userSlot && <div>{userSlot}</div>}
        </div>

        {/* Navigation Tabs */}
        <nav
          aria-label="Navigasi Utama"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 var(--space-6)',
            display: 'flex',
            gap: 'var(--space-2)',
            borderTop: '1px solid var(--color-border-subtle)',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'patients', label: 'Daftar Pasien' },
            { id: 'outpatient', label: 'Rawat Jalan' },
            { id: 'inpatient', label: 'Rawat Inap' },
            { id: 'pharmacy', label: 'Farmasi' },
          ].map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavChange?.(item.id)}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderBottom: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                  background: 'transparent',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'color 150ms ease, border-color 150ms ease',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content Area with generous padding */}
      <main
        style={{
          flex: 1,
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: 'var(--space-8) var(--space-6)',
        }}
      >
        {children}
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          padding: 'var(--space-4) var(--space-6)',
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <span>&copy; {new Date().getFullYear()} Inova Medika Solusindo - Arsitektur Feature-Based</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
              }}
              aria-hidden="true"
            />
            <span>Mode: <strong>Light Mode (WCAG AAA)</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
};
