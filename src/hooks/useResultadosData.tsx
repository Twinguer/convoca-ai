
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getRankingsWithUserInfo } from '@/integrations/supabase/rankings/userRankings';

export const useResultadosData = (concursoId: string) => {
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [userCanEdit, setUserCanEdit] = useState(false);
  
  // Get concurso details
  const { 
    data: concurso, 
    isLoading: loadingConcurso,
    isError: isErrorConcurso,
    error: concursoError
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
    data: rankings = [], 
    isLoading: loadingRankings 
  } = useQuery({
    queryKey: ['rankings', concursoId],
    queryFn: () => getRankingsWithUserInfo(concursoId),
    enabled: !!concursoId
  });

  // Get current user's participation in this concurso
  const { 
    data: userParticipation, 
    isLoading: loadingUserParticipation 
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

  // Combine all loading states
  const loading = loadingConcurso || loadingRankings || loadingUserParticipation;

  return {
    concurso,
    rankings,
    userParticipation,
    loading,
    error,
    userCanEdit
  };
};
