import React from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: 'var(--space-2) 0',
        marginBottom: 'var(--space-4)',
        fontSize: '0.8125rem',
      }}
    >
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          listStyle: 'none',
          padding: 0,
          margin: 0,
          flexWrap: 'wrap',
          gap: 'var(--space-1)',
        }}
      >
        <li style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>SIMRS</span>
          <span style={{ margin: '0 var(--space-2)', color: 'var(--color-border)', userSelect: 'none' }}>/</span>
        </li>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <li key={idx} style={{ display: 'inline-flex', alignItems: 'center' }}>
              {isLast ? (
                <span
                  aria-current="page"
                  style={{
                    fontWeight: 600,
                    color: 'var(--color-text-main)',
                  }}
                >
                  {item.label}
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={item.onClick}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--color-text-muted)',
                      cursor: item.onClick ? 'pointer' : 'default',
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </button>
                  <span style={{ margin: '0 var(--space-2)', color: 'var(--color-border)', userSelect: 'none' }}>/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
