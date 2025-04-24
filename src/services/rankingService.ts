
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
  weightedBasicScore?: number;
  weightedSpecific1Score?: number;
  weightedSpecific2Score?: number;
  weightedSpecific3Score?: number;
  weightedDiscursiveScore?: number;
  weightedCaseStudy1Score?: number;
  weightedCaseStudy2Score?: number;
  weightedCaseStudy3Score?: number;
}

// Helper function to get abbreviation for reservation type
const getReservationAbbreviation = (reservationType: string): string => {
  if (!reservationType || reservationType === 'Ampla Concorrência') return '';
  return reservationType.substring(0, 3).toUpperCase();
};

export const fetchUserRankings = async (concursoId: string, reservationType?: string): Promise<Ranking[]> => {
  try {
    console.log('Fetching rankings for concurso:', concursoId, 'with reservation type:', reservationType);
    
    // Use the materialized view for weighted scores
    let query = supabase
      .from('weighted_rankings_view')
      .select(`
        id,
        user_id,
        concurso_id,
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
        weighted_total_score,
        reservation_type
      `);
    
    // If a specific reservation type is requested, filter by it
    if (reservationType && reservationType !== 'Ampla Concorrência') {
      query = query.eq('reservation_type', reservationType);
    }
    
    const { data: rankings, error: rankingsError } = await query
      .order('weighted_total_score', { ascending: false });
      
    if (rankingsError) {
      console.error('Error in fetchUserRankings query:', rankingsError);
      throw rankingsError;
    }
    
    if (!rankings || rankings.length === 0) {
      return [];
    }
    
    // Fetch user profiles
    const userIds = rankings.map(ranking => ranking.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);
      
    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      throw profilesError;
    }
    
    // Map the rankings with profile information
    return rankings.map((ranking, index) => {
      const profile = profiles?.find(p => p.id === ranking.user_id);
      const userReservationType = ranking.reservation_type || 'Ampla Concorrência';
      const reservationAbbr = getReservationAbbreviation(userReservationType);
      const displayName = (profile?.name || 'Usuário Anônimo') + 
                       (reservationType === 'Ampla Concorrência' && reservationAbbr ? ` (${reservationAbbr})` : '');
      
      return {
        position: index + 1,
        name: displayName,
        score: ranking.weighted_total_score || 0,
        userId: ranking.user_id,
        avatarUrl: profile?.avatar_url || null,
        basicKnowledgeScore: ranking.basic_knowledge_score,
        specificKnowledge1Score: ranking.specific_knowledge_1_score,
        specificKnowledge2Score: ranking.specific_knowledge_2_score,
        specificKnowledge3Score: ranking.specific_knowledge_3_score,
        specificKnowledgeScore: ranking.specific_knowledge_score,
        discursiveScore: ranking.discursive_score,
        caseStudy1Score: ranking.case_study_1_score,
        caseStudy2Score: ranking.case_study_2_score,
        caseStudy3Score: ranking.case_study_3_score,
        weightedBasicScore: ranking.weighted_basic_score,
        weightedSpecific1Score: ranking.weighted_specific_1_score,
        weightedSpecific2Score: ranking.weighted_specific_2_score,
        weightedSpecific3Score: ranking.weighted_specific_3_score,
        weightedDiscursiveScore: ranking.weighted_discursive_score,
        weightedCaseStudy1Score: ranking.weighted_case_study_1_score,
        weightedCaseStudy2Score: ranking.weighted_case_study_2_score,
        weightedCaseStudy3Score: ranking.weighted_case_study_3_score,
        reservationType: userReservationType,
        displayReservation: reservationAbbr,
        id: ranking.id
      };
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
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
