import React, { useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb';
import { useAuth, UserProfile } from '@/features/auth';
import { getMenuInfoFromPath } from '@/routes/routes.config';
import type { MenuItem } from '@/config/dashboard-menu';

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

  // Mobile / desktop sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
        userRole={userRole}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeMenuId={activeMenuId}
        onSelectMenu={(item, parentGroup) => {
          handleSelectMenu(item, parentGroup);
          // Di layar ponsel, tutup sidebar setelah memilih menu
          if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
          }
        }}
      />

      {/* Main Container Wrapper */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: isSidebarOpen ? '260px' : 0,
          transition: 'margin-left 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          minWidth: 0,
        }}
      >
        {/* Topbar Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          userSlot={effectiveUserSlot}
        />

        {/* Content Area */}
        <main
          style={{
            flex: 1,
            padding: 'var(--space-6) var(--space-8)',
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
