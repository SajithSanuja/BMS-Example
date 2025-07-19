import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { toast } from 'sonner';

interface UseAuthGuardOptions {
  requiredRoles?: UserRole[];
  redirectTo?: string;
  requireAuth?: boolean;
}

export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const {
    requiredRoles,
    redirectTo = '/login',
    requireAuth = true,
  } = options;

  const { isAuthenticated, user, isLoading, checkAccess } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Check if authentication is required
    if (requireAuth && !isAuthenticated) {
      toast.error('Please log in to access this page');
      navigate(redirectTo, { replace: true });
      return;
    }

    // Check role-based access
    if (isAuthenticated && requiredRoles && !checkAccess(requiredRoles)) {
      toast.error('You do not have permission to access this page');
      navigate('/', { replace: true });
      return;
    }
  }, [isAuthenticated, user, isLoading, requiredRoles, navigate, redirectTo, requireAuth, checkAccess]);

  return {
    isAuthenticated,
    user,
    isLoading,
    hasAccess: checkAccess(requiredRoles),
  };
};

// Utility function to create role-specific guards
export const useAdminGuard = () => useAuthGuard({ requiredRoles: ['admin'] });
export const useManagerGuard = () => useAuthGuard({ requiredRoles: ['admin', 'manager'] });
export const useEmployeeGuard = () => useAuthGuard({ requiredRoles: ['admin', 'manager', 'employee'] });
