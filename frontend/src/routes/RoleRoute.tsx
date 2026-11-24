import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { isRoleAllowed } from '@/config/dashboard-menu';
import { ForbiddenPage } from './errors/ForbiddenPage';

export interface RoleRouteProps {
  allowedRoles: string[];
  moduleTitle?: string;
  children?: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  allowedRoles,
  moduleTitle,
  children,
}) => {
  const { user } = useAuth();

  const isAllowed = isRoleAllowed(allowedRoles, user?.role);

  if (!isAllowed) {
    return (
      <ForbiddenPage
        requiredRoles={allowedRoles}
        userRole={user?.role}
        moduleTitle={moduleTitle}
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
