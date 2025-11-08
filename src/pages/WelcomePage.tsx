import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { paymentService } from '@/services/paymentService';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const WelcomePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isPro, refetch } = useSubscription();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [countdown, setCountdown] = useState<number | null>(null); // null = não iniciou contagem ainda
  const hasVerifiedRef = useRef(false);
  const plan = searchParams.get('plan');

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    if (!plan) {
      navigate('/planos', { replace: true });
      return;
    }

    // Evitar execução duplicada
    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;

    const redirectUser = () => {
      if (plan.startsWith('coach_')) {
        navigate('/coach/dashboard', { replace: true });
      } else if (plan === 'pro' || isPro) {
        navigate('/estudos', { replace: true });
      } else {
        navigate('/planos', { replace: true });
      }
    };

    // Atualizar subscription
    refetch();
    
    // Mostrar sucesso imediatamente e iniciar contagem
    setStatus('success');
    setCountdown(5);
    
    const intervalId = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          redirectUser();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      redirectUser();
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [user, plan, navigate, isPro, refetch]);

  const getPlanName = () => {
    if (plan?.startsWith('coach_')) {
      const planType = plan.replace('coach_', '');
      const names: Record<string, string> = {
        starter: 'Modo Coach Starter',
        professional: 'Modo Coach Professional',
        enterprise: 'Modo Coach Enterprise',
      };
      return names[planType] || 'Modo Coach';
    } else if (plan === 'pro') {
      return 'Plano Pro';
    }
    return 'Premium';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/images/footer-logo.png"
              alt="Nomeia Aí Logo"
              className="h-auto max-w-[350px] md:max-w-[437px]"
            />
          </div>

          {status === 'verifying' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <h1 className="text-3xl font-bold mb-4 text-foreground">
                Bem-vindo ao {getPlanName()}!
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Estamos ativando seu acesso. Isso pode levar alguns instantes...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h1 className="text-3xl font-bold mb-4 text-foreground">
                Acesso Ativado!
              </h1>
              <p className="text-lg text-muted-foreground mb-2">
                Seu {getPlanName()} foi ativado com sucesso.
              </p>
              {countdown !== null && countdown > 0 && (
                <p className="text-sm text-muted-foreground mb-6">
                  Redirecionando em {countdown} segundo{countdown !== 1 ? 's' : ''}...
                </p>
              )}
              {countdown === 0 && (
                <p className="text-sm text-muted-foreground mb-6">
                  Redirecionando...
                </p>
              )}
              {countdown === null && (
                <p className="text-sm text-muted-foreground mb-6">
                  Você será redirecionado em instantes...
                </p>
              )}
            </>
          )}

          {status === 'error' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-yellow-500" />
              <h1 className="text-3xl font-bold mb-4 text-foreground">
                Processando seu pagamento
              </h1>
              <p className="text-lg text-muted-foreground mb-2">
                Estamos processando sua assinatura. Você receberá acesso em instantes.
              </p>
              {countdown !== null && countdown > 0 && (
                <p className="text-sm text-muted-foreground mb-6">
                  Redirecionando em {countdown} segundo{countdown !== 1 ? 's' : ''}...
                </p>
              )}
              {countdown === 0 && (
                <p className="text-sm text-muted-foreground mb-6">
                  Redirecionando...
                </p>
              )}
              {countdown === null && (
                <p className="text-sm text-muted-foreground mb-6">
                  Você será redirecionado em instantes...
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomePage;

