import React from 'react';

export interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
  userSlot?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  userSlot,
}) => {
  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-6)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Left side: Toggle button and Branch identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar Menu"
          aria-expanded={isSidebarOpen}
          aria-controls="dashboard-sidebar"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-main)',
            cursor: 'pointer',
          }}
        >
          {/* Hamburger Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              Simple SIMRS
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Live status and user slot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ display: 'none', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
            }}
            aria-hidden="true"
          />
          <span>Server Terkoneksi</span>
        </div>

        {userSlot && <div>{userSlot}</div>}
      </div>
    </header>
  );
};
