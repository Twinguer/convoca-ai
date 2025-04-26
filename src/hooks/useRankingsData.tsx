
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
        // Use camelCase properties consistently - these are now weighted scores
        basicKnowledgeScore: ranking.weightedBasicScore || ranking.weighted_basic_score || 0,
        specificKnowledgeScore: ranking.weightedSpecificScore || ranking.weighted_specific_score || 0,
        specificKnowledge1Score: ranking.weightedSpecific1Score || ranking.weighted_specific_1_score || 0,
        specificKnowledge2Score: ranking.weightedSpecific2Score || ranking.weighted_specific_2_score || 0,
        specificKnowledge3Score: ranking.weightedSpecific3Score || ranking.weighted_specific_3_score || 0,
        discursiveScore: ranking.weightedDiscursiveScore || ranking.weighted_discursive_score || 0,
        caseStudy1Score: ranking.weightedCaseStudy1Score || ranking.weighted_case_study_1_score || 0,
        caseStudy2Score: ranking.weightedCaseStudy2Score || ranking.weighted_case_study_2_score || 0,
        caseStudy3Score: ranking.weightedCaseStudy3Score || ranking.weighted_case_study_3_score || 0,
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
