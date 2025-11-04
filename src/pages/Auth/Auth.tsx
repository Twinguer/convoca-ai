
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthContainer } from '@/components/Auth/AuthContainer';

const Auth: React.FC = () => {
  const { user } = useAuth();

  // If already logged in, redirect to home
  if (user) {
    return <Navigate to="/" />;
  }

  return <AuthContainer />;
};

export default Auth;
