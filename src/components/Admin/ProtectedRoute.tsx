
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAdmin, isLoading } = useAdminAuth();

  // While checking the authentication status
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated as admin, redirect to secure login
  if (!isAdmin) {
    return <Navigate to="/project/admin/man/login" replace />;
  }

  // If authenticated as admin, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
