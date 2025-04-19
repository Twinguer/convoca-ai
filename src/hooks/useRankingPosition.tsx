
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to get the user's position in a ranking
 * @param rankingId The ID of the user's ranking entry
 * @returns The position (rank) of the user in the ranking
 */
export const useRankingPosition = (rankingId: string) => {
  const [position, setPosition] = useState<number | null>(null);
  
  const { data } = useQuery({
    queryKey: ['ranking-position', rankingId],
    queryFn: async () => {
      if (!rankingId) return null;
      
      // First, get the user ranking details to determine the concurso_id and score
      const { data: rankingData, error: rankingError } = await supabase
        .from('user_rankings')
        .select('concurso_id, score, user_id')
        .eq('id', rankingId)
        .single();
        
      if (rankingError) {
        console.error('Error fetching ranking data:', rankingError);
        return null;
      }
      
      if (!rankingData) return null;
      
      // Then, get all rankings for this concurso to determine position
      const { data: allRankings, error: rankingsError } = await supabase
        .from('user_rankings')
        .select('id, score')
        .eq('concurso_id', rankingData.concurso_id)
        .order('score', { ascending: false });
        
      if (rankingsError) {
        console.error('Error fetching all rankings:', rankingsError);
        return null;
      }
      
      // Find the position of the current user's ranking
      const position = allRankings.findIndex(r => r.id === rankingId) + 1;
      return position > 0 ? position : null;
    },
    enabled: !!rankingId
  });
  
  useEffect(() => {
    if (data !== undefined) {
      setPosition(data);
    }
  }, [data]);
  
  return position;
};
