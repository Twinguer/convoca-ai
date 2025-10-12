
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RankingItemProps } from '@/components/rankings/RankingList';

const fetchRankings = async (): Promise<RankingItemProps[]> => {
  try {
    const { data: concursos, error } = await supabase
      .from('concursos')
      .select(`
        id,
        titulo,
        orgao,
        banca,
        created_at,
        status,
        created_by_user_id,
        is_admin_created,
        localidades
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // For each concurso, get the participant count and creator info
    const rankings = await Promise.all(
      concursos.map(async (concurso) => {
        // Use RPC function to get participant count more reliably
        const { data: countData, error: countError } = await supabase
          .rpc('count_concurso_participants', { concurso_id: concurso.id });

        if (countError) {
          console.error('Error fetching participant count:', countError);
          return null;
        }

        // If there's a creator user ID, fetch their name (using public view)
        let creatorName = null;
        if (concurso.created_by_user_id && !concurso.is_admin_created) {
          const { data: userData, error: userError } = await supabase
            .from('users_profiles')
            .select('name')
            .eq('id', concurso.created_by_user_id)
            .maybeSingle();

          if (!userError && userData) {
            creatorName = userData.name;
          }
        }

        // Obter a primeira localidade (para compatibilidade com versões anteriores)
        let localidade = null;
        if (concurso.localidades && Array.isArray(concurso.localidades) && concurso.localidades.length > 0) {
          localidade = concurso.localidades[0];
        }

        return {
          id: concurso.id,
          examDate: concurso.created_at || new Date().toISOString(),
          banca: concurso.banca,
          concursoTitle: concurso.orgao,
          cargoTitle: concurso.titulo,
          participantCount: countData || 0,
          createdByUserId: concurso.created_by_user_id || null,
          creatorName: creatorName,
          isAdminCreated: concurso.is_admin_created,
          localidade: localidade
        };
      })
    );

    return rankings.filter(Boolean) as RankingItemProps[];
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
};

export function useRankingsData() {
  const { data: rankings = [], isLoading } = useQuery({
    queryKey: ['rankings'],
    queryFn: fetchRankings,
    // Ensuring data is updated every 2 minutes for all users
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    // Disabling retry to avoid too many calls in case of error
    retry: 1
  });

  return {
    rankings,
    isLoading
  };
}
