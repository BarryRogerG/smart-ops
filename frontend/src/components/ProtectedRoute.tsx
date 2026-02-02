import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // In showcase mode, we always have a user (guest admin if not authenticated)
  // So we don't redirect to login anymore
  if (!user) {
    // This shouldn't happen in showcase mode, but keep as fallback
    return <div>Loading user...</div>;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
