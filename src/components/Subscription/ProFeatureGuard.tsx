import React, { useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showProRequiredToast } from '@/utils/planRestrictions';

interface ProFeatureGuardProps {
  children: React.ReactNode;
  featureName: string;
}

// Map global para rastrear toasts já mostrados (por featureName)
const shownToasts = new Map<string, boolean>();

export const ProFeatureGuard = ({ 
  children, 
  featureName
}: ProFeatureGuardProps) => {
  const { isPro, isLoading } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    // Se não for Pro, mostrar toast e redirecionar APENAS UMA VEZ por featureName
    if (!isLoading && !isPro) {
      const toastKey = `toast-${featureName}`;
      if (!shownToasts.get(toastKey)) {
        shownToasts.set(toastKey, true);
        showProRequiredToast(navigate, featureName);
      }
    }
    
    // Cleanup: reset quando o componente desmontar (opcional)
    return () => {
      // Não resetar automaticamente para evitar múltiplos toasts durante navegação rápida
    };
  }, [isPro, isLoading, navigate, featureName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isPro) {
    // Retornar null pois o toast já redireciona
    return null;
  }

  return <>{children}</>;
};

