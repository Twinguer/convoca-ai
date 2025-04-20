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
}

// Helper function to get abbreviation for reservation type
const getReservationAbbreviation = (reservationType: string): string => {
  if (!reservationType || reservationType === 'Ampla Concorrência') return '';
  
  // Get first three letters as abbreviation
  const abbr = reservationType.substring(0, 3).toUpperCase();
  return abbr;
};

export const fetchUserRankings = async (concursoId: string, reservationType?: string): Promise<Ranking[]> => {
  try {
    console.log('Fetching rankings for concurso:', concursoId, 'with reservation type:', reservationType);
    
    // Build query depending on whether we want a specific reservation type
    let query = supabase
      .from('user_rankings')
      .select(`
        id,
        user_id,
        score,
        basic_knowledge_score,
        specific_knowledge_1_score,
        specific_knowledge_2_score,
        specific_knowledge_3_score,
        specific_knowledge_score,
        discursive_score,
        case_study_1_score,
        case_study_2_score,
        case_study_3_score,
        reservation_type
      `)
      .eq('concurso_id', concursoId);
    
    // If a specific reservation type is requested, filter by it
    if (reservationType && reservationType !== 'Ampla Concorrência') {
      query = query.eq('reservation_type', reservationType);
    } else if (reservationType === 'Ampla Concorrência') {
      // For Ampla Concorrência, include all users, as they all participate in this list
      // No additional filter needed
    }
      
    // Get concurso info to apply weights for score calculation
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select(`
        basic_knowledge_weight,
        specific_knowledge_1_weight,
        specific_knowledge_2_weight,
        specific_knowledge_3_weight,
        specific_knowledge_weight,
        discursive_weight,
        case_study_1_weight,
        case_study_2_weight,
        case_study_3_weight
      `)
      .eq('id', concursoId)
      .single();
      
    if (concursoError) {
      console.error('Error fetching concurso weights:', concursoError);
    }
      
    const { data: rankings, error: rankingsError } = await query.order('score', { ascending: false });
      
    if (rankingsError) {
      console.error('Error in fetchUserRankings query:', rankingsError);
      throw rankingsError;
    }
    
    // If no rankings, return empty array
    if (!rankings || rankings.length === 0) {
      return [];
    }
    
    // Now fetch the user profiles separately
    const userIds = rankings.map(ranking => ranking.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);
      
    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      throw profilesError;
    }
    
    console.log('User profiles data:', profiles);
    console.log('Raw rankings data:', rankings);
    
    // Determine weights from concurso if available
    const weights = {
      basicKnowledge: concurso?.basic_knowledge_weight || 1,
      specificKnowledge1: concurso?.specific_knowledge_1_weight || concurso?.specific_knowledge_weight || 1,
      specificKnowledge2: concurso?.specific_knowledge_2_weight || 1,
      specificKnowledge3: concurso?.specific_knowledge_3_weight || 1,
      discursive: concurso?.discursive_weight || 1,
      caseStudy1: concurso?.case_study_1_weight || 1,
      caseStudy2: concurso?.case_study_2_weight || 1,
      caseStudy3: concurso?.case_study_3_weight || 1
    };
    
    console.log('Applied weights:', weights);
    
    // Map the rankings with profile information and weighted scores
    const formattedRankings = rankings.map((ranking, index) => {
      const profile = profiles?.find(p => p.id === ranking.user_id);
      
      // Calculate weighted scores
      const basicKnowledgeScore = (ranking.basic_knowledge_score || 0) * weights.basicKnowledge;
      const specificKnowledge1Score = (ranking.specific_knowledge_1_score || 0) * weights.specificKnowledge1;
      const specificKnowledge2Score = (ranking.specific_knowledge_2_score || 0) * weights.specificKnowledge2;
      const specificKnowledge3Score = (ranking.specific_knowledge_3_score || 0) * weights.specificKnowledge3;
      const discursiveScore = (ranking.discursive_score || 0) * weights.discursive;
      const caseStudy1Score = (ranking.case_study_1_score || 0) * weights.caseStudy1;
      const caseStudy2Score = (ranking.case_study_2_score || 0) * weights.caseStudy2;
      const caseStudy3Score = (ranking.case_study_3_score || 0) * weights.caseStudy3;
      
      // Get reservation type and create display name with abbreviation if needed
      const userReservationType = ranking.reservation_type || 'Ampla Concorrência';
      const reservationAbbr = getReservationAbbreviation(userReservationType);
      
      return {
        position: index + 1,
        name: profile?.name || 'Usuário Anônimo',
        score: ranking.score || 0,
        userId: ranking.user_id,
        avatarUrl: profile?.avatar_url || null,
        basicKnowledgeScore,
        specificKnowledge1Score,
        specificKnowledge2Score,
        specificKnowledge3Score,
        discursiveScore,
        caseStudy1Score,
        caseStudy2Score,
        caseStudy3Score,
        reservationType: userReservationType,
        displayReservation: reservationAbbr
      };
    });
    
    console.log('Transformed rankings:', formattedRankings);
    return formattedRankings;
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
};

// Get the available reservation types for a concurso
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
