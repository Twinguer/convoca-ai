
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

interface LoginButtonProps {
  redirectUrl?: string;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ redirectUrl }) => {
  // Store the current URL to redirect back after login
  const redirectTo = redirectUrl || window.location.href;
  const encodedRedirect = encodeURIComponent(redirectTo);
  
  return (
    <Button asChild>
      <Link to={`/auth?redirect=${encodedRedirect}`} className="flex items-center">
        <LogIn className="mr-2 h-4 w-4" />
        Entrar
      </Link>
    </Button>
  );
};

export default LoginButton;
