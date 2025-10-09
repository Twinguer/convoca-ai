import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { UrlObfuscationService } from '@/services/urlObfuscation';
import { LoadingState } from '@/components/resultados/LoadingState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield } from 'lucide-react';

interface SecureConcursoRouteProps {
  children: React.ReactNode;
  action: 'resultados' | 'participar';
}

export const SecureConcursoRoute: React.FC<SecureConcursoRouteProps> = ({ 
  children, 
  action 
}) => {
  const { token } = useParams<{ token: string }>();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [concursoId, setConcursoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateAccess = async () => {
      if (!token) {
        setError('Token de acesso não fornecido');
        setIsValidating(false);
        return;
      }

      try {
        const validatedConcursoId = await UrlObfuscationService.validateConcursoToken(token);
        
        if (validatedConcursoId) {
          setConcursoId(validatedConcursoId);
          setIsValid(true);
        } else {
          setError('Token de acesso inválido ou expirado');
        }
      } catch (err) {
        setError('Erro ao validar acesso');
        console.error('Erro na validação:', err);
      } finally {
        setIsValidating(false);
      }
    };

    validateAccess();
  }, [token]);

  if (isValidating) {
    return <LoadingState />;
  }

  if (!isValid || !concursoId) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-5 w-5" />
              <span>{error || 'Token de acesso inválido'}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              O link que você está tentando acessar é inválido, expirado ou não existe.
            </p>
            <div className="pt-4">
              <a 
                href="/pre-classificacao" 
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Voltar para Rankings
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Passar o concursoId validado para os componentes filhos
  return (
    <div data-concurso-id={concursoId}>
      {React.cloneElement(children as React.ReactElement, { 
        concursoId,
        secureToken: token 
      })}
    </div>
  );
};
