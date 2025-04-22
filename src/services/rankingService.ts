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
    
    // Se um tipo de reserva específico for solicitado, filtre por ele
    if (reservationType && reservationType !== 'Ampla Concorrência') {
      query = query.eq('reservation_type', reservationType);
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
    
    console.log('Raw rankings data:', rankings);
    
    // Buscar perfis de usuário
    const userIds = rankings?.map(ranking => ranking.user_id) || [];
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);
      
    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      throw profilesError;
    }
    
    console.log('User profiles data:', profiles);
    
    // Map the rankings with profile information and scores
    const formattedRankings = rankings?.map((ranking, index) => {
      const profile = profiles?.find(p => p.id === ranking.user_id);
      
      // Log detalhado de cada ranking individual
      console.log('Processando ranking:', {
        userId: ranking.user_id,
        scores: {
          basic: ranking.basic_knowledge_score,
          specific1: ranking.specific_knowledge_1_score,
          specific2: ranking.specific_knowledge_2_score,
          specific3: ranking.specific_knowledge_3_score,
          discursive: ranking.discursive_score
        }
      });
      
      return {
        position: index + 1,
        name: profile?.name || 'Usuário Anônimo',
        score: ranking.score || 0,
        userId: ranking.user_id,
        avatarUrl: profile?.avatar_url || null,
        basicKnowledgeScore: ranking.basic_knowledge_score || 0,
        specificKnowledge1Score: ranking.specific_knowledge_1_score || 0,
        specificKnowledge2Score: ranking.specific_knowledge_2_score || 0,
        specificKnowledge3Score: ranking.specific_knowledge_3_score || 0,
        discursiveScore: ranking.discursive_score || 0,
        caseStudy1Score: ranking.case_study_1_score || 0,
        caseStudy2Score: ranking.case_study_2_score || 0,
        caseStudy3Score: ranking.case_study_3_score || 0,
        reservationType: ranking.reservation_type || 'Ampla Concorrência',
        displayReservation: getReservationAbbreviation(ranking.reservation_type || 'Ampla Concorrência')
      };
    }) || [];
    
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
