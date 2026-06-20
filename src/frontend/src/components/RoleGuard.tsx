import type { JSX, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types/user';

interface RoleGuardProps {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps): JSX.Element {
  const { currentUser } = useAuthStore();

  if (!currentUser) return <Navigate to="/login" replace />;
  if (!roles.includes(currentUser.role)) return fallback as JSX.Element;

  return children as JSX.Element;
}
