import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { RPCValidator } from '@/utils/rpcValidator';
import {
  isLaunchProPromoActive,
  isLaunchPromoSubscription,
} from '@/config/launchPromo';

export type SubscriptionPlan = 'free' | 'pro';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  is_active: boolean;
  expires_at: string | null;
  voucher_code: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();

  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // ✅ SEGURANÇA: RLS deve proteger, mas selecionamos apenas campos necessários
      // Nota: select('*') é aceitável aqui pois RLS garante que apenas o próprio usuário acessa
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user?.id,
    staleTime: 0, // Sempre buscar dados frescos
    cacheTime: 0, // Não cachear dados
    refetchOnWindowFocus: true, // Refetch quando a janela ganha foco
  });

  // Verificação rigorosa de Pro:
  // 1. Deve ter subscription registrada (não null)
  // 2. Deve ter plan='pro' exatamente
  // 3. Deve estar ativo (is_active=true)
  // 4. Se tem expires_at, deve estar no futuro (não expirado)
  // Se qualquer condição falhar, é Free
  
  const hasSubscription = !!subscription;
  const isPlanPro = subscription?.plan === 'pro';
  const isActive = subscription?.is_active === true;
  const hasValidExpiry = !subscription?.expires_at || new Date(subscription.expires_at) > new Date();
  
  const isPro = hasSubscription && isPlanPro && isActive && hasValidExpiry;
  const isFree = !isPro; // Se não atender TODAS as condições, é Free
  const isLaunchPromo =
    isPro && isLaunchPromoSubscription(subscription?.voucher_code ?? null);
  const launchPromoActive = isLaunchProPromoActive();

  // Limite de edições baseado no plano
  const maxEditCount = isPro ? Infinity : 3; // Pro = ilimitado, Free = 3

  const applyVoucher = async (code: string) => {
    try {
      // ✅ VALIDAÇÃO: Validar código antes de enviar
      const validatedCode = RPCValidator.validateVoucherCode(code);

      const { data, error } = await supabase.rpc('apply_voucher', {
        voucher_code_param: validatedCode
      });

      if (error) throw error;
      
      await refetch();
      return data;
    } catch (error: any) {
      // Re-throw com mensagem mais clara se for erro de validação
      if (error.message && (error.message.includes('Código') || error.message.includes('inválido'))) {
        throw new Error(error.message);
      }
      throw error;
    }
  };

  const validateDiscountVoucher = async (code: string) => {
    try {
      // ✅ VALIDAÇÃO: Validar código antes de enviar
      const validatedCode = RPCValidator.validateVoucherCode(code);

      const { data, error } = await supabase.rpc('validate_discount_voucher', {
        voucher_code_param: validatedCode
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      // Re-throw com mensagem mais clara se for erro de validação
      if (error.message && (error.message.includes('Código') || error.message.includes('inválido'))) {
        throw new Error(error.message);
      }
      throw error;
    }
  };

  return {
    subscription,
    isLoading,
    isPro,
    isFree,
    isLaunchPromo,
    launchPromoActive,
    expiresAt: subscription?.expires_at ?? null,
    maxEditCount, // Novo campo: limite de edições
    refetch,
    applyVoucher,
    validateDiscountVoucher
  };
};
