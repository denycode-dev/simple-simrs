import React from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from '../components/LoginForm';

export const LoginPage: React.FC = () => {
  const { user, isAuthenticated, isLoading, error, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromLocation = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/patients';

  if (isAuthenticated && user) {
    return <Navigate to={fromLocation} replace />;
  }

  const handleLoginSubmit = async (credentials: { username: string; password: string }) => {
    const success = await login(credentials);
    if (success) {
      navigate(fromLocation, { replace: true });
    }
    return success;
  };

  return (
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
        onSubmit={handleLoginSubmit}
        isLoading={isLoading}
        serverError={error}
      />
    </div>
  );
};
