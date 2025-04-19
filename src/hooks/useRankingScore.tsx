
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRankingScore(rankingId: string) {
  const { data: score } = useQuery({
    queryKey: ['ranking-score', rankingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_rankings')
        .select('score')
        .eq('id', rankingId)
        .single();
        
      if (error) throw error;
      return data?.score || 0;
    },
    enabled: !!rankingId
  });

  return score;
}
