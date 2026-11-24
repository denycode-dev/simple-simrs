import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';

export interface ServerErrorPageProps {
  error?: Error | unknown;
  resetErrorBoundary?: () => void;
}

export const ServerErrorPage: React.FC<ServerErrorPageProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : null;

  const errorStack = error instanceof Error ? error.stack : null;

  const handleReset = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      window.location.reload();
    }
  };

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
          maxWidth: '580px',
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
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
            <line x1="10" y1="6" x2="18" y2="6" />
            <line x1="10" y1="18" x2="18" y2="18" />
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
          Kesalahan Sistem (500 Internal Error)
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
          Terjadi Kendala pada Antarmuka Sistem
        </h1>

        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            marginBottom: 'var(--space-6)',
          }}
        >
          Sistem mendeteksi galat yang tidak terduga saat memproses komponen halaman.
          Data Anda tetap aman dan terisolasi oleh sistem pelindung. Silakan muat ulang halaman ini.
        </p>

        {errorMessage && (
          <div style={{ marginBottom: 'var(--space-6)', textAlign: 'left' }}>
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 'var(--space-1) 0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
              }}
            >
              <span>{showDetails ? 'Sembunyikan' : 'Tampilkan'} Rincian Masalah Teknis</span>
              <span aria-hidden="true">{showDetails ? '▲' : '▼'}</span>
            </button>

            {showDetails && (
              <div
                style={{
                  marginTop: 'var(--space-2)',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--color-surface-hover)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: 'var(--color-danger-text)',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {errorMessage}
                {errorStack && `

${errorStack}`}
              </div>
            )}
          </div>
        )}

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
            onClick={handleReset}
          >
            Muat Ulang Halaman
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/patients')}
          >
            Kembali ke Data Pasien
          </Button>
        </div>
      </div>
    </div>
  );
};
