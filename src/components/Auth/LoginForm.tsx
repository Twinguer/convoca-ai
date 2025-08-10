
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  isLocked: boolean;
  lockoutEnd: number | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading,
  isLocked,
  lockoutEnd
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email, password);
  };

  const getRemainingLockoutTime = () => {
    if (!lockoutEnd) return 0;
    return Math.ceil((lockoutEnd - Date.now()) / 60000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isLocked && lockoutEnd && (
        <Alert variant="destructive">
          <AlertDescription>
            <p className="font-medium">Conta temporariamente bloqueada</p>
            <p>Muitas tentativas de login. Tente novamente em {getRemainingLockoutTime()} minutos.</p>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLocked || isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="login-password">Senha</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLocked || isLoading}
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLocked || isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </Button>
    </form>
  );
};
