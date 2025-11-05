import { supabase } from '@/integrations/supabase/client';
import type { CoachSubscription } from '@/types/coach';

/**
 * Serviço para gerenciar assinaturas do coach
 */

export const coachSubscriptionService = {
  /**
   * Buscar assinatura ativa do coach
   */
  async getCoachSubscription(coachId: string): Promise<CoachSubscription | null> {
    const { data, error } = await supabase
      .from('coach_subscriptions')
      .select('*')
      .eq('coach_id', coachId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Criar assinatura para o coach
   */
  async createCoachSubscription(
    coachId: string,
    planType: 'starter' | 'professional' | 'enterprise'
  ): Promise<CoachSubscription> {
    const plans = {
      starter: { price: 49.90, max_students: 5 },
      professional: { price: 149.90, max_students: 25 },
      enterprise: { price: 249.90, max_students: 50 }
    };

    const { data, error } = await supabase
      .from('coach_subscriptions')
      .insert({
        coach_id: coachId,
        plan_type: planType,
        max_students: plans[planType].max_students,
        price: plans[planType].price,
        status: 'active',
        current_students: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Verificar se pode convidar aluno
   */
  async checkIfCanInvite(coachId: string) {
    const { data, error } = await supabase.rpc('check_if_can_invite_student', {
      p_coach_id: coachId
    });

    if (error) throw error;
    return data;
  }
};


