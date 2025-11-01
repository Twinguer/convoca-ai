import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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

  // Limite de edições baseado no plano
  const maxEditCount = isPro ? Infinity : 5; // Pro = ilimitado, Free = 5

  const applyVoucher = async (code: string) => {
    const { data, error } = await supabase.rpc('apply_voucher', {
      voucher_code_param: code
    });

    if (error) throw error;
    
    await refetch();
    return data;
  };

  const validateDiscountVoucher = async (code: string) => {
    const { data, error } = await supabase.rpc('validate_discount_voucher', {
      voucher_code_param: code.trim().toUpperCase()
    });

    if (error) throw error;
    return data;
  };

  return {
    subscription,
    isLoading,
    isPro,
    isFree,
    maxEditCount, // Novo campo: limite de edições
    refetch,
    applyVoucher,
    validateDiscountVoucher
  };
};
