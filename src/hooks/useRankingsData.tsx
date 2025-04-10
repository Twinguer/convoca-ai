
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RankingItemProps } from '@/components/rankings/RankingList';

// Function to get the bancas logos
const getBancaLogo = (banca: string): string => {
  switch (banca.toUpperCase()) {
    case 'CEBRASPE':
      return '/lovable-uploads/19dea1ff-907e-4128-9be2-52866086e6cb.png';
    case 'IBFC':
      return '/lovable-uploads/6ee31b0a-acde-4381-aee0-cc2cef46d263.png';
    case 'FCC':
      return '/lovable-uploads/36833afc-6f71-4ffe-b0f2-41aee0a8e0c4.png';
    case 'FGV':
      return '/lovable-uploads/95b3453d-2c74-48d6-b670-44eff515a18a.png';
    case 'VUNESP':
      return '/lovable-uploads/b9f4f05a-3df3-4589-a1c0-72d8c6f86bec.png';
    default:
      return '/lovable-uploads/d9dd6b7e-0366-4902-bda7-4276442d9a96.png';
  }
};

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
          participantCount: count || 0,
          logoUrl: getBancaLogo(concurso.banca)
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
  });

  return {
    rankings,
    isLoading
  };
}
