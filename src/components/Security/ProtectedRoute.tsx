
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  redirectTo = '/auth'
}) => {
  const { user, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(requireAdmin);
  const location = useLocation();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user || !requireAdmin) {
        setAdminCheckLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        setIsAdmin(!!data && !error);
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdminRole();
  }, [user, requireAdmin]);

  // Show loading while checking authentication
  if (isLoading || adminCheckLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Redirect if admin required but user is not admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/project/admin/man/login" replace />;
  }

  return <>{children}</>;
};
