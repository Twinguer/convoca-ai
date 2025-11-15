import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from './useSubscription';
import { useAuth } from './useAuth';
import { UserStudyService } from '@/services/userStudyService';
import { PLAN_LIMITS } from '@/utils/planRestrictions';

export const usePlanLimits = () => {
  const { user } = useAuth();
  const { isPro } = useSubscription();

  // Verificar quantos rankings o usuário criou
  const { data: createdRankingsCount, isLoading: isLoadingCreated } = useQuery({
    queryKey: ['user-created-rankings-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('concursos')
        .select('*', { count: 'exact', head: true })
        .eq('created_by_user_id', user.id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Verificar quantos rankings o usuário participa (total)
  const { data: participationData, isLoading: isLoadingParticipation } = useQuery({
    queryKey: ['user-rankings-participation', user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, created: 0, others: 0 };

      // Buscar dados consolidados do usuário
      const { data: userRankingData, error } = await supabase
        .from('user_rankings')
        .select('consolidated_data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!userRankingData?.consolidated_data?.rankings) {
        return { total: 0, created: 0, others: 0 };
      }

      const rankings = userRankingData.consolidated_data.rankings as Record<string, any>;
      const rankingIds = Object.keys(rankings);
      
      if (rankingIds.length === 0) {
        return { total: 0, created: 0, others: 0 };
      }

      // Buscar concursos para verificar quais foram criados pelo usuário
      const { data: concursos, error: concursosError } = await supabase
        .from('concursos')
        .select('id, created_by_user_id')
        .in('id', rankingIds.map(id => rankings[id].concurso_id).filter(Boolean));

      if (concursosError) throw concursosError;

      const createdByUser = concursos?.filter(c => c.created_by_user_id === user.id).length || 0;
      const total = rankingIds.length;
      const others = total - createdByUser;

      return { total, created: createdByUser, others };
    },
    enabled: !!user?.id,
  });

  // Verificar quantos ciclos ativos o usuário tem
  const { data: cycleCount, isLoading: isLoadingCycles } = useQuery({
    queryKey: ['user-cycle-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      try {
        const userStudyData = await UserStudyService.getUserStudyData(user.id);
        if (!userStudyData?.study_cycles) return 0;
        return userStudyData.study_cycles.filter(cycle => cycle.is_active).length;
      } catch (error) {
        console.debug('[usePlanLimits] Erro ao buscar ciclos:', error);
        return 0;
      }
    },
    enabled: !!user?.id,
    retry: false,
  });

  const limits = isPro ? PLAN_LIMITS.PRO : PLAN_LIMITS.FREE;
  
  // Usuários Free podem criar rankings ilimitados
  const canCreateRanking = true;
  
  // Usuários Free podem participar de rankings que criaram + até 2 que não criaram
  const canParticipateInRanking = isPro || 
    (participationData?.others || 0) < PLAN_LIMITS.FREE.MAX_RANKINGS_PARTICIPATION;

  const canCreateCycle = isPro;
  const canCreateStudyGroup = isPro || PLAN_LIMITS.FREE.CAN_CREATE_STUDY_GROUPS;
  const canBeCoachStudent = isPro || PLAN_LIMITS.FREE.CAN_BE_STUDENT_IN_COACH_MODE;

  return {
    // Rankings
    canCreateRanking,
    canParticipateInRanking,
    currentCreatedRankingsCount: createdRankingsCount || 0,
    currentParticipatingCount: participationData?.total || 0,
    participatingInOthersCount: participationData?.others || 0,
    maxParticipationInOthers: limits.MAX_RANKINGS_PARTICIPATION,
    
    // Ciclos
    canCreateCycle,
    currentCycleCount: cycleCount || 0,
    
    // Grupos de estudo
    canCreateStudyGroup,
    
    // Coach
    canBeCoachStudent,
    
    // Edições
    maxEditsPerAnswerSheet: limits.MAX_EDITS_PER_ANSWER_SHEET,
    
    // Status
    isPro,
    isLoading: isLoadingCreated || isLoadingParticipation || isLoadingCycles,
  };
};

