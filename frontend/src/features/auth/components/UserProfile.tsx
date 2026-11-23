import React from 'react';
import { Badge, Button } from '@/components/ui';
import type { AuthUser } from '../types';

export interface UserProfileProps {
  user: AuthUser;
  onLogout: () => void;
  isLoading?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, isLoading }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-main)' }}>
          {user.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{user.unit}</span>
          <Badge variant="primary" label={user.role} />
        </div>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onLogout}
        isLoading={isLoading}
        aria-label="Keluar dari akun"
      >
        Keluar
      </Button>
    </div>
  );
};
