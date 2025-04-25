import { supabase } from '@/integrations/supabase/client';

export interface Ranking {
  position: number;
  name: string;
  score: number;
  userId: string;
  avatarUrl?: string | null;
  basicKnowledgeScore?: number;
  specificKnowledge1Score?: number;
  specificKnowledge2Score?: number;
  specificKnowledge3Score?: number;
  specificKnowledgeScore?: number; // For backward compatibility
  discursiveScore?: number;
  caseStudy1Score?: number;
  caseStudy2Score?: number;
  caseStudy3Score?: number;
  reservationType?: string;
  displayReservation?: string;
  id: string;
  weightedBasicScore?: number;
  weightedSpecific1Score?: number;
  weightedSpecific2Score?: number;
  weightedSpecific3Score?: number;
  weightedDiscursiveScore?: number;
  weightedCaseStudy1Score?: number;
  weightedCaseStudy2Score?: number;
  weightedCaseStudy3Score?: number;
}

export const fetchUserRankings = async (concursoId: string, reservationType?: string): Promise<Ranking[]> => {
  try {
    console.log('Fetching rankings for concurso:', concursoId, 'with reservation type:', reservationType);
    
    let query = supabase
      .from('user_rankings')
      .select(`
        id,
        user_id,
        score,
        basic_knowledge_score,
        specific_knowledge_score,
        specific_knowledge_1_score,
        specific_knowledge_2_score,
        specific_knowledge_3_score,
        discursive_score,
        case_study_1_score,
        case_study_2_score,
        case_study_3_score,
        weighted_basic_score,
        weighted_specific_1_score,
        weighted_specific_2_score,
        weighted_specific_3_score,
        weighted_discursive_score,
        weighted_case_study_1_score,
        weighted_case_study_2_score,
        weighted_case_study_3_score,
        reservation_type,
        users_profiles (
          name,
          avatar_url
        )
      `)
      .eq('concurso_id', concursoId);
    
    if (reservationType && reservationType !== 'Ampla Concorrência') {
      query = query.eq('reservation_type', reservationType);
    }
      
    const { data: rankings, error: rankingsError } = await query.order('score', { ascending: false });
      
    if (rankingsError) {
      console.error('Error in fetchUserRankings query:', rankingsError);
      throw rankingsError;
    }
    
    if (!rankings || rankings.length === 0) {
      return [];
    }

    console.log('Raw rankings data:', rankings);
    
    const formattedRankings = rankings.map((ranking, index) => {
      // Safely access profile properties
      const profile = ranking.users_profiles ?? {};
      
      return {
        position: index + 1,
        name: profile?.name ?? 'Usuário Anônimo',
        avatarUrl: profile?.avatar_url ?? null,
        score: ranking.score || 0,
        userId: ranking.user_id,
        basicKnowledgeScore: ranking.basic_knowledge_score || 0,
        specificKnowledgeScore: ranking.specific_knowledge_score || 0,
        specificKnowledge1Score: ranking.specific_knowledge_1_score || 0,
        specificKnowledge2Score: ranking.specific_knowledge_2_score || 0,
        specificKnowledge3Score: ranking.specific_knowledge_3_score || 0,
        discursiveScore: ranking.discursive_score || 0,
        caseStudy1Score: ranking.case_study_1_score || 0,
        caseStudy2Score: ranking.case_study_2_score || 0,
        caseStudy3Score: ranking.case_study_3_score || 0,
        weightedBasicScore: ranking.weighted_basic_score || 0,
        weightedSpecific1Score: ranking.weighted_specific_1_score || 0,
        weightedSpecific2Score: ranking.weighted_specific_2_score || 0,
        weightedSpecific3Score: ranking.weighted_specific_3_score || 0,
        weightedDiscursiveScore: ranking.weighted_discursive_score || 0,
        weightedCaseStudy1Score: ranking.weighted_case_study_1_score || 0,
        weightedCaseStudy2Score: ranking.weighted_case_study_2_score || 0,
        weightedCaseStudy3Score: ranking.weighted_case_study_3_score || 0,
        reservationType: ranking.reservation_type || 'Ampla Concorrência',
        displayReservation: getReservationAbbreviation(ranking.reservation_type || 'Ampla Concorrência'),
        id: ranking.id
      };
    });
    
    console.log('Transformed rankings:', formattedRankings);
    return formattedRankings;
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
};

// Helper function to get abbreviation for reservation type
const getReservationAbbreviation = (reservationType: string): string => {
  if (!reservationType || reservationType === 'Ampla Concorrência') return '';
  
  // Get first three letters as abbreviation
  const abbr = reservationType.substring(0, 3).toUpperCase();
  return abbr;
};

export const getAvailableReservationTypes = async (concursoId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('concursos')
      .select(`
        has_ampla_concorrencia,
        has_ppp,
        has_pcd,
        has_hipossuficientes,
        has_indigenas,
        has_transsexuais
      `)
      .eq('id', concursoId)
      .single();
    
    if (error) {
      console.error('Error fetching concurso reservation types:', error);
      return ['Ampla Concorrência'];
    }
    
    const types = [];
    
    // Ampla Concorrência is always available
    types.push('Ampla Concorrência');
    
    if (data.has_ppp) types.push('PPP');
    if (data.has_pcd) types.push('PCD');
    if (data.has_hipossuficientes) types.push('Hipossuficientes');
    if (data.has_indigenas) types.push('Indígenas');
    if (data.has_transsexuais) types.push('Pessoas Trans');
    
    console.log('Available reservation types for concurso', concursoId, ':', types);
    return types;
  } catch (error) {
    console.error('Error determining available reservation types:', error);
    return ['Ampla Concorrência'];
  }
};
