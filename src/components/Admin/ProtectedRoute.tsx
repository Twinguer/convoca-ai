
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check if the user is authenticated via localStorage or URL parameter
    const adminAuth = localStorage.getItem('adminAuth') === 'true';
    
    // Check URL for admin=true parameter
    const urlParams = new URLSearchParams(window.location.search);
    const adminParam = urlParams.get('admin') === 'true';
    
    setIsAuthenticated(adminAuth || adminParam);
    
    // If authenticated via URL param, save to localStorage
    if (adminParam && !adminAuth) {
      localStorage.setItem('adminAuth', 'true');
    }
  }, [location]);

  // While checking the authentication status
  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/project/admin/man/login" replace />;
  }

  // If authenticated, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
