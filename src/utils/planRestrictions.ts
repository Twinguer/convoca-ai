import { toast } from 'sonner';
import { NavigateFunction } from 'react-router-dom';

/**
 * Função utilitária padronizada para mostrar toast de restrição de plano Pro
 * e redirecionar para a página de planos
 */
export const showProRequiredToast = (navigate: NavigateFunction, featureName?: string) => {
  const message = featureName 
    ? `O recurso "${featureName}" está disponível apenas no plano Pro.`
    : 'Este recurso está disponível apenas no plano Pro.';
  
  toast.error(message, {
    duration: 6000
  });
  
  navigate('/planos');
};

