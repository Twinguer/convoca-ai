import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';

interface PlanLimitsResponse {
  is_pro: boolean;
  is_coach: boolean;
  can_create_ranking: boolean;
  can_participate_in_ranking: boolean;
  can_create_cycle: boolean;
  can_create_study_group: boolean;
  can_be_coach_student: boolean;
  can_access_study_groups: boolean;
  limits: {
    max_rankings_created: number | null;
    max_rankings_participation: number | null;
    max_edits_per_answer_sheet: number | null;
    can_create_study_groups: boolean;
    can_be_student_in_coach_mode: boolean;
  };
  current_usage: {
    created_rankings_count: number;
    participation_data: {
      total: number;
      created: number;
      others: number;
    };
    cycle_count: number;
  };
}

/**
 * Hook que busca limites de plano do backend
 * ✅ SEGURANÇA: Todas as validações são feitas no backend via RPC
 */
export const usePlanLimits = () => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-plan-limits', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }

      const { data: result, error: rpcError } = await supabase.rpc('get_user_plan_limits', {
        p_user_id: user.id,
      });

      if (rpcError) {
        devLog.error('[usePlanLimits] Erro ao buscar limites:', rpcError);
        throw rpcError;
      }

      return result as PlanLimitsResponse;
    },
    enabled: !!user?.id,
    staleTime: 30000, // Cache por 30 segundos
    retry: 1,
  });

  // Valores padrão enquanto carrega
  const defaults = {
    is_pro: false,
    is_coach: false,
    can_create_ranking: true,
    can_participate_in_ranking: false,
    can_create_cycle: false,
    can_create_study_group: false,
    can_be_coach_student: false,
    can_access_study_groups: false,
    limits: {
      max_rankings_created: null,
      max_rankings_participation: 2,
      max_edits_per_answer_sheet: 3,
      can_create_study_groups: false,
      can_be_student_in_coach_mode: false,
    },
    current_usage: {
      created_rankings_count: 0,
      participation_data: {
        total: 0,
        created: 0,
        others: 0,
      },
      cycle_count: 0,
    },
  };

  const planData = data || defaults;

  return {
    // Rankings
    canCreateRanking: planData.can_create_ranking,
    canParticipateInRanking: planData.can_participate_in_ranking,
    currentCreatedRankingsCount: planData.current_usage.created_rankings_count,
    currentParticipatingCount: planData.current_usage.participation_data.total,
    participatingInOthersCount: planData.current_usage.participation_data.others,
    maxParticipationInOthers: planData.limits.max_rankings_participation || 2,
    
    // Ciclos
    canCreateCycle: planData.can_create_cycle,
    currentCycleCount: planData.current_usage.cycle_count,
    
    // Grupos de estudo
    canCreateStudyGroup: planData.can_create_study_group,
    
    // Coach
    canBeCoachStudent: planData.can_be_coach_student,
    
    // Edições
    maxEditsPerAnswerSheet: planData.limits.max_edits_per_answer_sheet || 3,
    
    // Status
    isPro: planData.is_pro,
    isLoading,
    error,
  };
};

