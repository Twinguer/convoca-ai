
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthContainer } from '@/components/Auth/AuthContainer';

const Auth: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Se estiver na página de reset de senha, não redirecionar mesmo com usuário logado
  if (location.pathname === '/auth/reset-password') {
    return <AuthContainer />;
  }

  // Se for recovery, não redirecionar
  const isRecovery = localStorage.getItem('is_password_recovery') === 'true';
  if (isRecovery) {
    return <AuthContainer />;
  }

  // If already logged in, redirect to home (exceto se for recovery)
  if (user) {
    return <Navigate to="/" />;
  }

  return <AuthContainer />;
};

export default Auth;
