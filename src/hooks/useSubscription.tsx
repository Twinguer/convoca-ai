import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { RPCValidator } from '@/utils/rpcValidator';
import {
  isLaunchProPromoActive,
  isLaunchPromoSubscription,
  hasLaunchPromoProAccess,
} from '@/config/launchPromo';
import { ensureLaunchProSubscriptionIfPromoActive } from '@/utils/ensureLaunchProSubscription';
import { resolveIsProWithBackend } from '@/utils/subscriptionPlan';

export type SubscriptionPlan = 'free' | 'pro';

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  is_active: boolean;
  expires_at: string | null;
  voucher_code: string | null;
}

type SubscriptionQueryResult = {
  subscription: Subscription | null;
  isProFromBackend: boolean;
};

export const useSubscription = () => {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<SubscriptionQueryResult> => {
      if (!user?.id) {
        return { subscription: null, isProFromBackend: false };
      }

      // Garantir Pro de lançamento no banco quando RPC existir (ignora 404 se migration pendente)
      await ensureLaunchProSubscriptionIfPromoActive();

      const [subResult, proResult] = await Promise.all([
        supabase.from('user_subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.rpc('is_user_pro', { p_user_id: user.id }),
      ]);

      if (subResult.error) {
        throw subResult.error;
      }

      if (proResult.error && import.meta.env.DEV) {
        console.warn('[useSubscription] is_user_pro RPC:', proResult.error.message);
      }

      return {
        subscription: subResult.data as Subscription | null,
        isProFromBackend: proResult.data === true,
      };
    },
    enabled: !!user?.id,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const subscription = data?.subscription ?? null;
  const isProFromBackend = resolveIsProWithBackend(subscription, data?.isProFromBackend);
  const isPro =
    isProFromBackend || hasLaunchPromoProAccess(user?.id);
  const isFree = !isPro;
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
