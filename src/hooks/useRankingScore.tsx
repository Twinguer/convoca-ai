
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to get the user's score in a ranking
 * @param rankingId The ID of the user's ranking entry
 * @returns The score of the user in the ranking
 */
export const useRankingScore = (rankingId: string) => {
  const [score, setScore] = useState<number | null>(null);
  
  const { data } = useQuery({
    queryKey: ['ranking-score', rankingId],
    queryFn: async () => {
      if (!rankingId) return null;
      
      const { data, error } = await supabase
        .from('user_rankings')
        .select('score')
        .eq('id', rankingId)
        .single();
        
      if (error) {
        console.error('Error fetching ranking score:', error);
        return null;
      }
      
      return data?.score || null;
    },
    enabled: !!rankingId
  });
  
  useEffect(() => {
    if (data !== undefined) {
      setScore(data);
    }
  }, [data]);
  
  return score;
};
