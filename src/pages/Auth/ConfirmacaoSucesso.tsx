import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const ConfirmacaoSucesso: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/auth');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleGoToLogin = () => {
    navigate('/auth');
  };

  const handleGoToSite = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-background to-primary-100 p-4">
      <Card className="w-full max-w-lg shadow-2xl border-primary/20">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <CheckCircle2 className="w-16 h-16 text-primary animate-bounce" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-primary">
              E-mail Confirmado!
            </h1>
            <p className="text-lg text-muted-foreground">
              Seu cadastro foi concluído com sucesso
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <div className="space-y-4">
            <p className="text-foreground text-lg">
              Bem-vindo ao <span className="font-bold text-primary">Convoca Aí</span>! 🎉
            </p>
            
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border-l-4 border-primary">
              <h3 className="font-semibold text-base mb-3 text-primary">
                Agora você pode:
              </h3>
              <div className="space-y-2 text-sm text-left">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Criar e participar de rankings</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Comparar seu desempenho</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Acompanhar sua evolução</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
            <p className="text-sm text-muted-foreground">
              Redirecionando para o login em{' '}
              <span className="font-bold text-primary text-2xl">{countdown}</span>{' '}
              segundos
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-3 pt-6">
          <Button 
            onClick={handleGoToLogin}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg group"
          >
            Fazer Login Agora
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <Button
            onClick={handleGoToSite}
            variant="outline"
            className="w-full py-6"
          >
            Voltar para a Home
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Sua conta está ativa e pronta para uso!
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConfirmacaoSucesso;
