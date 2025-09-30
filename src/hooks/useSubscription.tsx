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
  });

  const isPro = subscription?.plan === 'pro' && subscription?.is_active;
  const isFree = !subscription || subscription?.plan === 'free' || !subscription?.is_active;

  const applyVoucher = async (code: string) => {
    const { data, error } = await supabase.rpc('apply_voucher', {
      voucher_code_param: code
    });

    if (error) throw error;
    
    await refetch();
    return data;
  };

  return {
    subscription,
    isLoading,
    isPro,
    isFree,
    refetch,
    applyVoucher
  };
};
