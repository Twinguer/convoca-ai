
import React from 'react';
import { Trophy } from 'lucide-react';
import { RankingList } from '@/components/rankings/RankingList';
import { useRankingsData } from '@/hooks/useRankingsData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PreClassificacao = () => {
  // Fetch rankings data
  const {
    rankings,
    isLoading: isLoadingRankings
  } = useRankingsData();

  // Fetch all active concursos to transform the data
  const { data: concursos, isLoading: isLoadingConcursos } = useQuery({
    queryKey: ['all-concursos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concursos')
        .select('*')
        .eq('status', 'Em andamento');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Transform the rankings data to match RankingItemProps
  const rankingItems = React.useMemo(() => {
    if (!rankings || !concursos) return [];

    // Group rankings by concurso
    const grouped = rankings.reduce((acc, ranking) => {
      if (!acc[ranking.concursoId]) {
        acc[ranking.concursoId] = {
          participants: 0,
          highestScore: 0
        };
      }
      
      acc[ranking.concursoId].participants += 1;
      if (ranking.score > acc[ranking.concursoId].highestScore) {
        acc[ranking.concursoId].highestScore = ranking.score;
      }
      
      return acc;
    }, {} as Record<string, { participants: number, highestScore: number }>);

    // Map to required format
    return concursos.map(concurso => ({
      id: concurso.id,
      examDate: concurso.data_publicacao || new Date().toISOString().split('T')[0],
      banca: concurso.banca || 'Desconhecida',
      concursoTitle: concurso.titulo || 'Concurso',
      cargoTitle: concurso.custom_job_title || concurso.predefined_job_title || 'Cargo Público',
      participantCount: grouped[concurso.id]?.participants || 0
    }));
  }, [rankings, concursos]);

  const isLoading = isLoadingRankings || isLoadingConcursos;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Trophy className="mr-2 h-7 w-7 text-yellow-500" />
        Rankings
      </h1>
      
      <RankingList rankings={rankingItems} isLoading={isLoading} />
    </div>
  );
};

export default PreClassificacao;
