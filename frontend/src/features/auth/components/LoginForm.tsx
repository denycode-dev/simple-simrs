import React, { useState } from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Alert } from '@/components/ui';
import type { LoginCredentials } from '../types';

export interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<boolean>;
  isLoading?: boolean;
  serverError?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading = false,
  serverError,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!username.trim()) {
      setFormError('Username tidak boleh kosong');
      return;
    }
    if (!password.trim()) {
      setFormError('Kata sandi tidak boleh kosong');
      return;
    }

    await onSubmit({ username, password });
  };

  const displayedError = formError || serverError;

  return (
    <Card
      elevation="med"
      padding={6}
      style={{
        maxWidth: '440px',
        width: '100%',
        margin: '0 auto',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <CardHeader style={{ textAlign: 'center', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <CardTitle style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
          Masuk Petugas Medis
        </CardTitle>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
          Gunakan akun SIMRS Anda untuk mengakses modul
        </p>
      </CardHeader>
      <CardContent style={{ padding: '0' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {displayedError && <Alert variant="danger">{displayedError}</Alert>}

          <Input
            id="auth-username"
            label="Username Petugas"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            placeholder="misal: admin"
            autoComplete="username"
            required
          />

          <Input
            id="auth-password"
            label="Kata Sandi"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          <div
            style={{
              backgroundColor: 'var(--color-surface-hover)',
              border: '1px solid var(--color-border-subtle)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            <strong>Kredensial Demo:</strong> <code style={{ color: 'var(--color-primary)' }}>admin</code> / <code style={{ color: 'var(--color-primary)' }}>admin123</code>
          </div>

          <div style={{ paddingTop: 'var(--space-2)' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              style={{ width: '100%' }}
            >
              Masuk ke Sistem
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
