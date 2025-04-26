
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRankingsWithUserInfo } from '@/integrations/supabase/rankings/userRankings';

export const useRankingsData = (concursoId?: string) => {
  const {
    data: rankings,
    isLoading,
    error
  } = useQuery({
    queryKey: ['rankings', concursoId],
    queryFn: () => getRankingsWithUserInfo(concursoId as string),
    enabled: !!concursoId
  });

  // Sort rankings by weighted score and apply position
  const sortedRankings = useMemo(() => {
    if (!rankings) return [];

    return rankings
      .sort((a, b) => b.score - a.score)
      .map((ranking, index) => ({
        ...ranking,
        position: index + 1,
        // Display weighted scores
        basicKnowledgeScore: ranking.basic_knowledge_score,
        specificKnowledgeScore: ranking.specific_knowledge_score,
        specificKnowledge1Score: ranking.specific_knowledge_1_score,
        specificKnowledge2Score: ranking.specific_knowledge_2_score,
        specificKnowledge3Score: ranking.specific_knowledge_3_score,
        discursiveScore: ranking.discursive_score,
        caseStudy1Score: ranking.case_study_1_score,
        caseStudy2Score: ranking.case_study_2_score,
        caseStudy3Score: ranking.case_study_3_score,
        // The total score is already weighted from the database
        score: ranking.score
      }));
  }, [rankings]);

  return {
    rankings: sortedRankings,
    isLoading,
    error
  };
};
