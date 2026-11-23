import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb';
import type { MenuItem } from '@/config/dashboard-menu';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  userSlot?: React.ReactNode;
  activeMenuId: string;
  onSelectMenu: (item: MenuItem, parentGroupTitle?: string) => void;
  breadcrumbItems: BreadcrumbItem[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userSlot,
  activeMenuId,
  onSelectMenu,
  breadcrumbItems,
}) => {
  // Mobile / desktop sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeMenuId={activeMenuId}
        onSelectMenu={(item, parentGroup) => {
          onSelectMenu(item, parentGroup);
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
          userSlot={userSlot}
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

          {/* Main Content Render */}
          {children}
        </main>
      </div>
    </div>
  );
};
