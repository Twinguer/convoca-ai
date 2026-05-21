import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { coachSubscriptionService } from '@/integrations/supabase/coach/subscriptions';

/**
 * Acesso a recursos de estudos do plano Pro: assinatura Pro do aluno OU Modo Coach ativo.
 */
export function useStudyProAccess() {
  const { user } = useAuth();
  const { isPro, isLoading: isLoadingPro } = useSubscription();

  const { data: coachSubscription, isLoading: isLoadingCoach } = useQuery({
    queryKey: ['coach-subscription-study-access', user?.id],
    queryFn: () => coachSubscriptionService.getCoachSubscription(user!.id),
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const isCoachActive = coachSubscription?.status === 'active';

  const canAccessStudyPro = isPro || isCoachActive;
  const isLoading = isLoadingPro || isLoadingCoach;

  return {
    isPro,
    isCoachActive,
    canAccessStudyPro,
    isLoading,
  };
}
