import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Sidebar, SIDEBAR_WIDTH } from './Sidebar';
import { Header } from './Header';
import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb';
import { useAuth, UserProfile } from '@/features/auth';
import { getMenuInfoFromPath } from '@/routes/routes.config';
import type { MenuItem } from '@/config/dashboard-menu';

const DESKTOP_BREAKPOINT = 1024;

function getIsDesktop(): boolean {
  if (typeof window === 'undefined') return true;
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches;
  }
  return window.innerWidth >= DESKTOP_BREAKPOINT;
}

export interface DashboardLayoutProps {
  children?: React.ReactNode;
  userSlot?: React.ReactNode;
  activeMenuId?: string;
  onSelectMenu?: (item: MenuItem, parentGroupTitle?: string) => void;
  breadcrumbItems?: BreadcrumbItem[];
  userRole?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userSlot,
  activeMenuId: propActiveMenuId,
  onSelectMenu: propOnSelectMenu,
  breadcrumbItems: propBreadcrumbItems,
  userRole: propUserRole,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoading: isAuthLoading } = useAuth();

  // Deteksi viewport desktop vs mobile/tablet agar perilaku sidebar adaptif
  const [isDesktop, setIsDesktop] = useState<boolean>(getIsDesktop);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(getIsDesktop);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const handleViewportChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
      setIsSidebarOpen(event.matches);
    };

    mediaQuery.addEventListener('change', handleViewportChange);
    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, []);

  // Derive active menu info from current URL pathname
  const menuInfo = getMenuInfoFromPath(location.pathname);
  const activeMenuId = propActiveMenuId || menuInfo.activeMenuId;
  const breadcrumbItems = propBreadcrumbItems || menuInfo.breadcrumbTrail;
  const userRole = propUserRole || user?.role;

  const handleSelectMenu = (item: MenuItem, parentGroupTitle?: string) => {
    if (propOnSelectMenu) {
      propOnSelectMenu(item, parentGroupTitle);
    }
    if (item.path) {
      navigate(item.path);
    }
  };

  const effectiveUserSlot =
    userSlot !== undefined
      ? userSlot
      : user && <UserProfile user={user} onLogout={logout} isLoading={isAuthLoading} />;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text-main)',
      }}
    >
      {/* Dynamic Collapsible Sidebar */}
      <Sidebar
        id="dashboard-sidebar"
        userRole={userRole}
        isOpen={isSidebarOpen}
        isDesktop={isDesktop}
        onClose={() => setIsSidebarOpen(false)}
        activeMenuId={activeMenuId}
        onSelectMenu={(item, parentGroup) => {
          handleSelectMenu(item, parentGroup);
          // Di layar ponsel & tablet, tutup sidebar setelah memilih menu
          if (!isDesktop) {
            setIsSidebarOpen(false);
          }
        }}
      />

      {/* Main Container Wrapper */}
      <div
        data-testid="dashboard-main-wrapper"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: isDesktop && isSidebarOpen ? `${SIDEBAR_WIDTH}px` : 0,
          transition: 'margin-left 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          minWidth: 0,
        }}
      >
        {/* Topbar Header */}
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          userSlot={effectiveUserSlot}
        />

        {/* Content Area */}
        <main
          style={{
            flex: 1,
            padding: isDesktop ? 'var(--space-6) var(--space-8)' : 'var(--space-4)',
            maxWidth: '1440px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          {/* Dynamic Breadcrumb Trail */}
          <Breadcrumb items={breadcrumbItems} />

          {/* Main Content Render (Children or React Router Outlet) */}
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
