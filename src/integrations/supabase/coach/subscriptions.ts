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
      .maybeSingle(); // Usar maybeSingle em vez de single para evitar erro 406

    // PGRST116 = nenhum resultado encontrado (normal quando não há subscription)
    // PGRST406 = Not Acceptable (RLS Policy bloqueando - usuário não é coach)
    if (error && error.code !== 'PGRST116' && error.code !== 'PGRST406') {
      throw error;
    }
    return data;
  },

  /**
   * ⚠️ REMOVIDO: createCoachSubscription
   * 
   * Assinaturas Coach devem ser criadas APENAS via Stripe.
   * Use paymentService.createCheckout() para criar assinatura.
   * 
   * Esta função foi removida para evitar criação de assinaturas sem pagamento.
   */

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


