import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/integrations/supabase/toast-utils';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando autenticação...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Verificar se há código de autorização na URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Erro ao autenticar. Tente novamente.');
          showErrorToast('Erro na autenticação', errorDescription || 'Não foi possível completar a autenticação.');
          
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
          return;
        }

        if (code) {
          // Trocar código por sessão
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            setStatus('error');
            setMessage('Erro ao processar autenticação. Tente novamente.');
            showErrorToast('Erro na autenticação', 'Não foi possível processar a autenticação.');
            
            setTimeout(() => {
              navigate('/auth');
            }, 3000);
            return;
          }

          if (data.session) {
            setStatus('success');
            setMessage('Autenticação realizada com sucesso! Redirecionando...');
            showSuccessToast('Login realizado!', 'Bem-vindo de volta!');
            
            setTimeout(() => {
              navigate('/');
            }, 2000);
          }
        } else {
          // Verificar se já há uma sessão ativa
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            setStatus('success');
            setMessage('Autenticação realizada com sucesso! Redirecionando...');
            showSuccessToast('Login realizado!', 'Bem-vindo de volta!');
            
            setTimeout(() => {
              navigate('/');
            }, 2000);
          } else {
            setStatus('error');
            setMessage('Não foi possível autenticar. Tente novamente.');
            showErrorToast('Erro na autenticação', 'Não foi possível completar a autenticação.');
            
            setTimeout(() => {
              navigate('/auth');
            }, 3000);
          }
        }
      } catch (error: any) {
        setStatus('error');
        setMessage('Erro inesperado. Tente novamente.');
        showErrorToast('Erro interno', 'Ocorreu um erro ao processar a autenticação.');
        
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-center text-muted-foreground">{message}</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <p className="text-center text-muted-foreground">{message}</p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <div className="rounded-full bg-red-100 p-4">
                  <AlertCircle className="h-12 w-12 text-red-600" />
                </div>
                <p className="text-center text-muted-foreground">{message}</p>
                <p className="text-sm text-center text-muted-foreground">
                  Você será redirecionado automaticamente...
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;

