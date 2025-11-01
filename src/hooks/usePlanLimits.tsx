import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';
import { useAuth } from './useAuth';

export const usePlanLimits = () => {
  const { user } = useAuth();
  const { isPro } = useSubscription();

  // Verificar quantos rankings o usuário tem
  const { data: rankingCount, isLoading: isLoadingRankings } = useQuery({
    queryKey: ['user-ranking-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('user_rankings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Verificar quantos ciclos ativos o usuário tem
  const { data: cycleCount, isLoading: isLoadingCycles } = useQuery({
    queryKey: ['user-cycle-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('study_cycles_v2')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const maxRankings = isPro ? 5 : 1;
  const canCreateRanking = isPro ? (rankingCount || 0) < 5 : (rankingCount || 0) < 1;
  const canCreateCycle = isPro;

  return {
    canCreateRanking,
    canCreateCycle,
    maxRankings,
    currentRankingCount: rankingCount || 0,
    currentCycleCount: cycleCount || 0,
    isPro,
    isLoading: isLoadingRankings || isLoadingCycles,
  };
};

