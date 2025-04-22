
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursoById, getParticipantCount } from '@/services/concursoService';
import { fetchUserRankings } from '@/services/rankingService';
import { useAuth } from '@/hooks/useAuth';
import type { Ranking } from '@/services/rankingService';
import { supabase } from '@/integrations/supabase/client';

export function useResultadosData() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const isAuthenticated = !!user;
  
  // Fetch concurso details
  const { data: concurso, isLoading: isLoadingConcurso } = useQuery({
    queryKey: ['concurso', id],
    queryFn: () => fetchConcursoById(id),
    staleTime: 60000, // 1 minuto
  });
  
  // Fetch creator information if available
  const { data: creatorInfo, isLoading: isLoadingCreator } = useQuery({
    queryKey: ['creator', concurso?.created_by_user_id],
    queryFn: async () => {
      if (!concurso?.created_by_user_id) return null;
      
      const { data, error } = await supabase
        .from('users_profiles')
        .select('name')
        .eq('id', concurso.created_by_user_id)
        .single();
        
      if (error) {
        console.error('Error fetching creator info:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!concurso?.created_by_user_id,
    staleTime: 300000, // 5 minutos
  });
  
  // Fetch rankings - apenas quando solicitado explicitamente, sem refetchInterval
  const { data: rankings = [], isLoading: isLoadingRankings, refetch: refetchRankings } = useQuery({
    queryKey: ['rankings', id],
    queryFn: () => isAuthenticated ? fetchUserRankings(id) : Promise.resolve([]),
    // Removida a atualização automática (refetchInterval)
    refetchOnWindowFocus: false, // Desabilitada atualização em foco
    staleTime: 300000, // Considerado atual por 5 minutos
    enabled: isAuthenticated,
  });
  
  // Fetch participant count - sem atualização automática
  const { data: participantCount = 0, isLoading: isLoadingCount, refetch: refetchCount } = useQuery({
    queryKey: ['participant-count', id],
    queryFn: () => getParticipantCount(id),
    // Removida a atualização automática (refetchInterval)
    refetchOnWindowFocus: false, // Desabilitada atualização em foco
    staleTime: 300000, // 5 minutos
  });
  
  // Find user's ranking - only if user is authenticated
  const userRanking = isAuthenticated ? rankings.find((r: Ranking) => r.userId === user?.id) : null;
  
  const isLoading = isLoadingConcurso || (isAuthenticated && isLoadingRankings) || isLoadingCount || isLoadingCreator;
  
  // Function to manually refresh all data - mantida para atualização manual
  const refreshData = () => {
    console.log("[useResultadosData] Atualizando dados manualmente");
    if (isAuthenticated) {
      refetchRankings();
    }
    refetchCount();
  };
  
  return {
    concurso,
    rankings,
    participantCount,
    userRanking,
    isLoading,
    user,
    refreshData,
    creatorName: creatorInfo?.name || (concurso?.is_admin_created ? 'Administrador' : 'Usuário'),
    inscritos: concurso?.inscritos || 0
  };
}
