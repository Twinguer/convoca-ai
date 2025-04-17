
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getRankingsWithUserInfo } from '@/integrations/supabase/rankings/userRankings';
import { Ranking } from '@/services/rankingService';

export const useResultadosData = (concursoId: string) => {
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [userCanEdit, setUserCanEdit] = useState(false);
  
  // Get concurso details
  const { 
    data: concurso, 
    isLoading: loadingConcurso,
    isError: isErrorConcurso,
    error: concursoError,
    refetch: refetchConcurso
  } = useQuery({
    queryKey: ['concurso', concursoId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('concursos')
          .select(`
            *,
            created_by_user_id,
            is_admin_created
          `)
          .eq('id', concursoId)
          .single();
        
        if (error) throw error;
        
        // Get creator name if it's not admin-created
        if (data.created_by_user_id && !data.is_admin_created) {
          const { data: userData, error: userError } = await supabase
            .from('users_profiles')
            .select('name')
            .eq('id', data.created_by_user_id)
            .maybeSingle();
            
          if (!userError && userData) {
            data.creatorName = userData.name;
          }
        }
        
        return data;
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar o concurso');
        throw err;
      }
    },
    enabled: !!concursoId
  });

  // Get all user rankings for this concurso
  const { 
    data: rawRankings = [], 
    isLoading: loadingRankings,
    refetch: refetchRankings
  } = useQuery({
    queryKey: ['rankings', concursoId],
    queryFn: () => getRankingsWithUserInfo(concursoId),
    enabled: !!concursoId
  });

  // Convert raw rankings to typed Ranking array
  const rankings: Ranking[] = rawRankings.map(r => ({
    position: r.position,
    name: r.name as string, // Ensure name is treated as string
    score: r.score,
    userId: r.userId,
    avatarUrl: r.avatarUrl as string | undefined, // Fix avatarUrl type
    basicKnowledgeScore: r.basicKnowledgeScore,
    specificKnowledge1Score: r.specificKnowledge1Score || r.specificKnowledgeScore, // Handle both formats
    specificKnowledge2Score: r.specificKnowledge2Score,
    specificKnowledge3Score: r.specificKnowledge3Score,
    specificKnowledgeScore: r.specificKnowledgeScore, // For backward compatibility
    discursiveScore: r.discursiveScore,
    caseStudy1Score: r.caseStudy1Score || 0, // Provide defaults
    caseStudy2Score: r.caseStudy2Score || 0,
    caseStudy3Score: r.caseStudy3Score || 0,
    reservationType: r.reservationType || 'Ampla Concorrência',
    displayReservation: r.displayReservation || ''
  }));

  // Get current user's participation in this concurso
  const { 
    data: userParticipation, 
    isLoading: loadingUserParticipation,
    refetch: refetchUserParticipation 
  } = useQuery({
    queryKey: ['user-participation', concursoId, user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('user_rankings')
          .select('*')
          .eq('concurso_id', concursoId)
          .eq('user_id', user?.id)
          .maybeSingle();
          
        if (error) throw error;
        return data;
      } catch (err) {
        console.error("Error fetching user participation:", err);
        return null;
      }
    },
    enabled: !!concursoId && !!user
  });

  // Get user ranking if the user is participating
  const userRanking = user && userParticipation ? 
    rankings.find(r => r.userId === user.id) : null;

  // Calculate participant count
  const participantCount = rankings.length;

  // Check if current user can edit this concurso (is creator or admin)
  useEffect(() => {
    if (user && concurso) {
      const isCreator = concurso.created_by_user_id === user.id;
      const isAdmin = user.user_metadata?.is_admin === true;
      setUserCanEdit(isCreator || isAdmin);
    } else {
      setUserCanEdit(false);
    }
  }, [user, concurso]);

  // Function to refresh all data
  const refreshData = useCallback(() => {
    refetchConcurso();
    refetchRankings();
    if (user) {
      refetchUserParticipation();
    }
  }, [refetchConcurso, refetchRankings, refetchUserParticipation, user]);

  // Combine all loading states
  const loading = loadingConcurso || loadingRankings || loadingUserParticipation;
  const isLoading = loading;

  return {
    concurso,
    rankings,
    userParticipation,
    userRanking,
    participantCount,
    loading,
    isLoading,
    error,
    userCanEdit,
    user,
    refreshData
  };
};
