import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const ConfirmacaoSucesso: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

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
          <div className="space-y-3">
            <p className="text-foreground">
              Bem-vindo ao <span className="font-bold text-primary">Convoca Aí</span>!
            </p>
            <p className="text-sm text-muted-foreground">
              Agora você já pode participar de rankings de concursos, 
              comparar suas notas com outros candidatos e acompanhar 
              sua classificação em tempo real.
            </p>
          </div>

          <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
            <p className="text-sm text-muted-foreground">
              Redirecionando automaticamente em{' '}
              <span className="font-bold text-primary text-lg">{countdown}</span>{' '}
              segundos...
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-3 pt-6">
          <Button 
            onClick={handleGoToSite}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg group"
          >
            Ir para o site
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Já pode fazer login e começar a usar todas as funcionalidades!
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConfirmacaoSucesso;
