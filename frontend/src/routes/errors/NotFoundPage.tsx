import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      role="region"
      aria-labelledby="not-found-heading"
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
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto var(--space-4)',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-hidden="true"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </div>

        <span
          style={{
            display: 'inline-block',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 'var(--space-2)',
          }}
        >
          Galat 404
        </span>

        <h1
          id="not-found-heading"
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--color-text-main)',
            marginBottom: 'var(--space-3)',
            letterSpacing: '-0.02em',
          }}
        >
          Halaman Tidak Ditemukan
        </h1>

        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            marginBottom: 'var(--space-6)',
          }}
        >
          Modul atau tautan yang Anda tuju tidak ditemukan pada sistem Simple SIMRS.
          Silakan periksa kembali alamat URL atau kembali ke modul pasien.
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
            onClick={() => navigate(-1)}
          >
            Halaman Sebelumnya
          </Button>
        </div>
      </div>
    </div>
  );
};
