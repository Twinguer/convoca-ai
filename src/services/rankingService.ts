
import { supabase } from '@/integrations/supabase/client';

export interface Ranking {
  position: number;
  name: string;
  score: number;
  userId: string;
  avatarUrl?: string | null;
  // Raw scores
  basicKnowledgeScore?: number | null;
  specificKnowledgeScore?: number | null;
  specificKnowledge1Score?: number | null;
  specificKnowledge2Score?: number | null;
  specificKnowledge3Score?: number | null;
  discursiveScore?: number | null;
  caseStudy1Score?: number | null;
  caseStudy2Score?: number | null;
  caseStudy3Score?: number | null;
  // Weighted scores
  weightedBasicScore?: number | null;
  weightedSpecific1Score?: number | null;
  weightedSpecific2Score?: number | null;
  weightedSpecific3Score?: number | null;
  weightedDiscursiveScore?: number | null;
  weightedCaseStudy1Score?: number | null;
  weightedCaseStudy2Score?: number | null;
  weightedCaseStudy3Score?: number | null;
  // Additional fields
  reservationType: string;
  displayReservation: string;
  id: string;
  isClassified: boolean; // New field to indicate if the candidate is classified
}

export const fetchUserRankings = async (concursoId: string): Promise<Ranking[]> => {
  try {
    // Modificado para usar a função RPC que inclui o campo is_classified
    const { data, error } = await supabase.rpc('get_realtime_rankings', {
      p_concurso_id: concursoId
    });

    if (error) {
      console.error('Error fetching rankings:', error);
      throw error;
    }

    const rankings = data.map((item, index) => {
      return {
        position: index + 1,
        name: item.user_name || 'Anônimo',
        score: item.score || 0,
        userId: item.user_id,
        avatarUrl: item.avatar_url,
        basicKnowledgeScore: item.basic_knowledge_score || 0,
        specificKnowledgeScore: item.specific_knowledge_score || 0,
        specificKnowledge1Score: item.specific_knowledge_1_score || 0,
        specificKnowledge2Score: item.specific_knowledge_2_score || 0,
        specificKnowledge3Score: item.specific_knowledge_3_score || 0,
        discursiveScore: item.discursive_score || 0,
        caseStudy1Score: item.case_study_1_score || 0,
        caseStudy2Score: item.case_study_2_score || 0,
        caseStudy3Score: item.case_study_3_score || 0,
        weightedBasicScore: item.weighted_basic_score || 0,
        weightedSpecific1Score: item.weighted_specific_1_score || 0,
        weightedSpecific2Score: item.weighted_specific_2_score || 0,
        weightedSpecific3Score: item.weighted_specific_3_score || 0,
        weightedDiscursiveScore: item.weighted_discursive_score || 0,
        weightedCaseStudy1Score: item.weighted_case_study_1_score || 0,
        weightedCaseStudy2Score: item.weighted_case_study_2_score || 0,
        weightedCaseStudy3Score: item.weighted_case_study_3_score || 0,
        reservationType: item.reservation_type || 'Ampla Concorrência',
        displayReservation: item.reservation_type || 'Ampla Concorrência',
        id: item.id,
        isClassified: item.is_classified // Novo campo que indica se o candidato está classificado
      };
    });

    return rankings;
  } catch (error) {
    console.error('Error in fetchUserRankings:', error);
    return [];
  }
};

export const getSubjectScores = async (rankingId: string) => {
  try {
    const { data, error } = await supabase.rpc('get_candidate_subject_scores', {
      p_ranking_id: rankingId
    });

    if (error) {
      console.error('Error fetching subject scores:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSubjectScores:', error);
    return [];
  }
};
