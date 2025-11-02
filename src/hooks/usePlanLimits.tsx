import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';
import { useAuth } from './useAuth';
import { UserStudyService } from '@/services/userStudyService';

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
  // ✅ CORREÇÃO: Usar UserStudyService em vez de buscar diretamente de study_cycles_v2
  // Os ciclos estão armazenados no JSONB de user_study_v2, não em uma tabela separada
  const { data: cycleCount, isLoading: isLoadingCycles } = useQuery({
    queryKey: ['user-cycle-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      try {
        // Buscar dados do usuário que contém os ciclos no JSONB
        const userStudyData = await UserStudyService.getUserStudyData(user.id);
        
        if (!userStudyData?.study_cycles) return 0;
        
        // Contar apenas ciclos ativos
        return userStudyData.study_cycles.filter(cycle => cycle.is_active).length;
      } catch (error) {
        // Silenciar erros (pode não ter dados ainda)
        console.debug('[usePlanLimits] Erro ao buscar ciclos:', error);
        return 0;
      }
    },
    enabled: !!user?.id,
    retry: false,
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

