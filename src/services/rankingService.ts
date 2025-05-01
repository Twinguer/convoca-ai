
import { supabase } from '@/integrations/supabase/client';

// Defining the Ranking interface to fix TypeScript errors
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
  reservationType: string;
  displayReservation: string;
  id: string;
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
    
    // Buscar todos os rankings deste concurso com as respostas brutas
    // A pontuação será calculada em tempo real pelo banco de dados
    const { data: rankings, error: rankingsError } = await supabase.rpc('get_realtime_rankings', {
      p_concurso_id: concursoId,
      p_reservation_type: reservationType || null
    });
      
    if (rankingsError) {
      console.error('Error in get_realtime_rankings RPC call:', rankingsError);
      throw rankingsError;
    }
    
    // Se não há rankings, retornar array vazio
    if (!rankings || rankings.length === 0) {
      return [];
    }
    
    // Log data for debugging
    if (rankings.length > 0) {
      const firstRanking = rankings[0];
      console.log('First ranking data from realtime calculation:', {
        id: firstRanking.id,
        user_id: firstRanking.user_id,
        score: firstRanking.score,
        basic_score: firstRanking.basic_knowledge_score,
        specific1_score: firstRanking.specific_knowledge_1_score,
        weighted_basic: firstRanking.weighted_basic_score,
        weighted_specific1: firstRanking.weighted_specific_1_score
      });
    }
    
    // Formatar os dados do ranking com posições
    const formattedRankings = rankings.map((ranking, index) => {
      return {
        position: index + 1,
        name: ranking.user_name || 'Usuário Anônimo',
        score: ranking.score || 0,
        userId: ranking.user_id,
        avatarUrl: ranking.avatar_url || null,
        basicKnowledgeScore: ranking.basic_knowledge_score || 0,
        specificKnowledgeScore: ranking.specific_knowledge_score || 0,
        specificKnowledge1Score: ranking.specific_knowledge_1_score || 0,
        specificKnowledge2Score: ranking.specific_knowledge_2_score || 0,
        specificKnowledge3Score: ranking.specific_knowledge_3_score || 0,
        discursiveScore: ranking.discursive_score || 0,
        caseStudy1Score: ranking.case_study_1_score || 0,
        caseStudy2Score: ranking.case_study_2_score || 0,
        caseStudy3Score: ranking.case_study_3_score || 0,
        // Add weighted scores
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
    
    return formattedRankings;
  } catch (error) {
    console.error('Error fetching rankings with realtime calculation:', error);
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
