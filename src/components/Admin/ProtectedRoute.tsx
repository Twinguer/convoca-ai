
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user is authenticated
    const checkAuth = () => {
      const auth = localStorage.getItem('adminAuth') === 'true';
      const authExpiry = localStorage.getItem('adminAuthExpiry');
      
      // Check if token is expired
      if (auth && authExpiry) {
        const expiryTime = parseInt(authExpiry, 10);
        
        // If expired, redirect to login
        if (Date.now() > expiryTime) {
          localStorage.removeItem('adminAuth');
          localStorage.removeItem('adminAuthExpiry');
          localStorage.removeItem('adminAuthToken');
          setIsAuthenticated(false);
          return;
        }
      }
      
      setIsAuthenticated(auth);
    };
    
    checkAuth();
    
    // Set up an interval to periodically check authentication
    const authCheckInterval = setInterval(checkAuth, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(authCheckInterval);
  }, [navigate]);

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
