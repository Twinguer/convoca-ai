import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const ConfirmacaoSucesso: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Se o usuário já estiver autenticado após confirmação, redireciona após 3 segundos
    if (user) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Email Confirmado!</CardTitle>
          <CardDescription>
            Seu cadastro foi confirmado com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {user 
              ? 'Você será redirecionado automaticamente em alguns segundos...'
              : 'Você já pode fazer login na plataforma.'}
          </p>
          <Button 
            onClick={() => navigate(user ? '/' : '/auth')} 
            className="w-full"
          >
            {user ? 'Ir para início' : 'Fazer login'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmacaoSucesso;
