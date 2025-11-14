import React, { useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showProRequiredToast } from '@/utils/planRestrictions';

interface ProFeatureGuardProps {
  children?: React.ReactNode;
  featureName: string;
}

export const ProFeatureGuard = ({ 
  children, 
  featureName
}: ProFeatureGuardProps) => {
  const { isPro, isLoading } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirecionar imediatamente se não for Pro
    if (!isLoading && !isPro) {
      showProRequiredToast(navigate, featureName);
    }
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

