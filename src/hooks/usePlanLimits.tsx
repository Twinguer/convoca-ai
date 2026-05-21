import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { devLog } from '@/utils/productionLogger';
import { coachSubscriptionService } from '@/integrations/supabase/coach/subscriptions';

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

const DEFAULT_PLAN_LIMITS: PlanLimitsResponse = {
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
    participation_data: { total: 0, created: 0, others: 0 },
    cycle_count: 0,
  },
};

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

      let planLimits = result as PlanLimitsResponse | null;

      if (rpcError) {
        devLog.error('[usePlanLimits] Erro ao buscar limites:', rpcError);
        planLimits = null;
      }

      // Fallback: assinatura Coach ativa (quando RPC não retorna is_coach)
      if (!planLimits?.is_coach) {
        try {
          const coachSub = await coachSubscriptionService.getCoachSubscription(user.id);
          const coachActive =
            !!coachSub &&
            coachSub.status === 'active' &&
            (!coachSub.expires_at || new Date(coachSub.expires_at) > new Date());
          if (coachActive && planLimits) {
            planLimits = {
              ...planLimits,
              is_coach: true,
              can_create_cycle: true,
              can_access_study_groups: true,
              can_create_study_group: planLimits.can_create_study_group || true,
            };
          } else if (coachActive && !planLimits) {
            planLimits = {
              ...DEFAULT_PLAN_LIMITS,
              is_coach: true,
              can_create_cycle: true,
              can_access_study_groups: true,
              can_create_study_group: true,
            };
          }
        } catch {
          // RLS ou ausência de assinatura — manter limites da RPC
        }
      }

      if (!planLimits && rpcError) {
        throw rpcError;
      }

      return planLimits;
    },
    enabled: !!user?.id,
    staleTime: 30000,
    retry: 1,
  });

  const planData = data || DEFAULT_PLAN_LIMITS;

  return {
    // Rankings
    canCreateRanking: planData.can_create_ranking,
    canParticipateInRanking: planData.can_participate_in_ranking,
    currentCreatedRankingsCount: planData.current_usage.created_rankings_count,
    currentParticipatingCount: planData.current_usage.participation_data.total,
    participatingInOthersCount: planData.current_usage.participation_data.others,
    maxParticipationInOthers: planData.limits.max_rankings_participation || 2,
    
    // Ciclos (Pro ou Modo Coach ativo)
    canCreateCycle: planData.can_create_cycle || planData.is_coach,
    currentCycleCount: planData.current_usage.cycle_count,
    
    // Grupos de estudo
    canCreateStudyGroup: planData.can_create_study_group,
    canAccessStudyGroups:
      planData.can_access_study_groups || planData.is_pro || planData.is_coach,

    // Coach
    canBeCoachStudent: planData.can_be_coach_student,
    isCoach: planData.is_coach,

    // Edições
    maxEditsPerAnswerSheet: planData.limits.max_edits_per_answer_sheet || 3,

    // Status
    isPro: planData.is_pro,
    isLoading,
    error,
  };
};

