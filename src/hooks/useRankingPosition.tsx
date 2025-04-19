
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRankingPosition(rankingId: string) {
  const { data: position } = useQuery({
    queryKey: ['ranking-position', rankingId],
    queryFn: async () => {
      const { data: rankings, error } = await supabase
        .from('user_rankings')
        .select('score')
        .order('score', { ascending: false });
        
      if (error) throw error;
      
      const { data: currentRanking } = await supabase
        .from('user_rankings')
        .select('score')
        .eq('id', rankingId)
        .single();
        
      if (!currentRanking) return null;
      
      const position = rankings.findIndex(r => r.score <= currentRanking.score) + 1;
      return position;
    },
    enabled: !!rankingId
  });

  return position;
}
