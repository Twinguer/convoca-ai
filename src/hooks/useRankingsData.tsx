
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
        data_publicacao,
        etapa_atual
      `)
      .order('data_publicacao', { ascending: false });

    if (error) throw error;

    // For each concurso, get the participant count
    const rankings = await Promise.all(
      concursos.map(async (concurso) => {
        const { count, error: countError } = await supabase
          .from('user_rankings')
          .select('*', { count: 'exact', head: true })
          .eq('concurso_id', concurso.id);

        if (countError) {
          console.error('Error fetching participant count:', countError);
          return null;
        }

        return {
          id: concurso.id,
          examDate: concurso.data_publicacao || new Date().toISOString(),
          banca: concurso.banca,
          concursoTitle: concurso.orgao,
          cargoTitle: concurso.titulo,
          participantCount: count || 0
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
    // Garantindo que os dados sejam atualizados a cada 5 minutos mesmo para usuários não logados
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    // Desabilitando o retry para evitar muitas chamadas em caso de erro
    retry: 1
  });

  return {
    rankings,
    isLoading
  };
}
