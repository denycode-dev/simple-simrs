import React, { useState, useEffect } from 'react';
import { DASHBOARD_MENU, filterMenuByRole, type MenuItem } from '@/config/dashboard-menu';
import { Badge } from '@/components/ui';

export const SIDEBAR_WIDTH = 260;

export interface SidebarProps {
  id?: string;
  isOpen: boolean;
  isDesktop?: boolean;
  onClose: () => void;
  activeMenuId: string;
  onSelectMenu: (item: MenuItem, parentGroupTitle?: string) => void;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  id = 'dashboard-sidebar',
  isOpen,
  isDesktop = true,
  onClose,
  activeMenuId,
  onSelectMenu,
  userRole,
}) => {
  const visibleMenuGroups = React.useMemo(() => filterMenuByRole(DASHBOARD_MENU, userRole), [userRole]);
  // Simpan state open/close submenu
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    registration: true,
  });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Auto-expand parent menu when child menu item is active
  useEffect(() => {
    visibleMenuGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children && item.children.some((child) => child.id === activeMenuId)) {
          setExpandedMenus((prev) => ({
            ...prev,
            [item.id]: true,
          }));
        }
      });
    });
  }, [activeMenuId, visibleMenuGroups]);

  // Tutup sidebar dengan tombol Escape pada mode drawer (mobile/tablet)
  useEffect(() => {
    if (isDesktop || !isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktop, isOpen, onClose]);

  // Kunci scroll halaman utama saat drawer terbuka di mobile/tablet
  useEffect(() => {
    if (isDesktop || !isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDesktop, isOpen]);

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  return (
    <>
      {/* Transparent Click-Outside Catcher (khusus mobile/tablet, tanpa backdrop hitam/blur) */}
      {!isDesktop && isOpen && (
        <div
          data-testid="sidebar-click-outside"
          role="presentation"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'transparent',
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id={id}
        aria-label="Sidebar Menu"
        aria-hidden={!isOpen}
        inert={!isOpen}
        style={{
          width: isDesktop ? `${SIDEBAR_WIDTH}px` : `min(${SIDEBAR_WIDTH}px, 85vw)`,
          backgroundColor: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          visibility: isOpen ? 'visible' : 'hidden',
          transition: isOpen
            ? 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1), visibility 0ms linear 0ms'
            : 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1), visibility 0ms linear 220ms',
          boxShadow: !isDesktop && isOpen ? 'var(--shadow-lg)' : 'none',
        }}
      >
        {/* Sidebar Header Brand */}
        <div
          style={{
            height: '64px',
            flexShrink: 0,
            padding: '0 var(--space-5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-text-inverse)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.125rem',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              +
            </div>
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                Simple SIMRS
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                Hospital Management
              </div>
            </div>
          </div>

          {/* Mobile / Tablet close button */}
          {!isDesktop && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Sidebar"
              style={{
                background: 'none',
                border: 'none',
                minWidth: '40px',
                minHeight: '40px',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Dynamic Menu Groups List */}
        <nav
          aria-label="Navigasi Utama"
          style={{
            flex: 1,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: 'var(--space-4) var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
          }}
        >
          {visibleMenuGroups.map((group, groupIdx) => (
            <div key={group.groupTitle || groupIdx}>
              {group.groupTitle && (
                <div
                  style={{
                    padding: '0 var(--space-3) var(--space-2)',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {group.groupTitle}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.items.map((item) => {
                  const hasChildren = Boolean(item.children && item.children.length > 0);
                  const isExpanded = Boolean(expandedMenus[item.id]);
                  const isActiveLeaf = activeMenuId === item.id && !hasChildren;
                  const isParentActive =
                    activeMenuId === item.id ||
                    Boolean(item.children && item.children.some((child) => child.id === activeMenuId));
                  const isHovered = hoveredId === item.id;

                  return (
                    <div key={item.id}>
                      {/* Menu Item Button */}
                      <button
                        type="button"
                        aria-expanded={hasChildren ? isExpanded : undefined}
                        aria-current={isActiveLeaf ? 'page' : undefined}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId((prev) => (prev === item.id ? null : prev))}
                        onClick={() => {
                          if (hasChildren) {
                            toggleSubmenu(item.id);
                          } else {
                            onSelectMenu(item, group.groupTitle);
                          }
                        }}
                        style={{
                          width: '100%',
                          minHeight: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: 'none',
                          backgroundColor: isActiveLeaf
                            ? 'var(--color-primary-light)'
                            : isHovered
                              ? 'var(--color-surface-hover)'
                              : 'transparent',
                          color: isActiveLeaf
                            ? 'var(--color-primary)'
                            : 'var(--color-text-secondary)',
                          fontSize: '0.875rem',
                          fontWeight: isParentActive ? 600 : 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 150ms ease, color 150ms ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          {/* Dot / Icon indicator */}
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              flexShrink: 0,
                              backgroundColor: isParentActive ? 'var(--color-primary)' : 'var(--color-border)',
                            }}
                            aria-hidden="true"
                          />
                          <span>{item.title}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          {item.badge && <Badge variant="primary" label={item.badge} />}
                          {hasChildren && (
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                color: 'var(--color-text-muted)',
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 150ms ease',
                              }}
                              aria-hidden="true"
                            >
                              ▶
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Nested Submenu Items */}
                      {hasChildren && isExpanded && (
                        <div
                          style={{
                            paddingLeft: '1.25rem',
                            marginTop: '2px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            borderLeft: '2px solid var(--color-border-subtle)',
                            marginLeft: '1rem',
                          }}
                        >
                          {item.children?.map((subItem) => {
                            const isChildActive = activeMenuId === subItem.id;
                            const isChildHovered = hoveredId === subItem.id;

                            return (
                              <button
                                key={subItem.id}
                                type="button"
                                aria-current={isChildActive ? 'page' : undefined}
                                onMouseEnter={() => setHoveredId(subItem.id)}
                                onMouseLeave={() => setHoveredId((prev) => (prev === subItem.id ? null : prev))}
                                onClick={() => onSelectMenu(subItem, group.groupTitle)}
                                style={{
                                  width: '100%',
                                  minHeight: '36px',
                                  padding: '0.4375rem 0.625rem',
                                  borderRadius: 'var(--radius-sm)',
                                  border: 'none',
                                  backgroundColor: isChildActive
                                    ? 'var(--color-primary-light)'
                                    : isChildHovered
                                      ? 'var(--color-surface-hover)'
                                      : 'transparent',
                                  color: isChildActive
                                    ? 'var(--color-primary)'
                                    : 'var(--color-text-muted)',
                                  fontSize: '0.8125rem',
                                  fontWeight: isChildActive ? 600 : 500,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: 'background-color 150ms ease, color 150ms ease',
                                }}
                              >
                                {subItem.title}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div
          style={{
            flexShrink: 0,
            padding: 'var(--space-4)',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
          }}
        >
          <span>Simple SIMRS v1.0</span>
        </div>
      </aside>
    </>
  );
};
