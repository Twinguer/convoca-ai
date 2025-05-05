
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
  // Minimum score flags
  isDisqualified?: boolean;
  basicScoreFailed?: boolean;
  specific1ScoreFailed?: boolean;
  specific2ScoreFailed?: boolean;
  specific3ScoreFailed?: boolean;
  discursiveScoreFailed?: boolean;
  caseStudy1Failed?: boolean;
  caseStudy2Failed?: boolean;
  caseStudy3Failed?: boolean;
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
    
    // Get concurso settings first to check minimum scores
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select(`
        has_minimum_score,
        minimum_score_type,
        minimum_score_unit_type,
        total_minimum_score,
        basic_knowledge_minimum_score,
        specific_knowledge_1_minimum_score,
        specific_knowledge_2_minimum_score,
        specific_knowledge_3_minimum_score,
        discursive_minimum_score,
        case_study_1_minimum_score,
        case_study_2_minimum_score,
        case_study_3_minimum_score,
        
        basic_knowledge_weight,
        specific_knowledge_1_weight,
        specific_knowledge_2_weight,
        specific_knowledge_3_weight,
        discursive_weight,
        case_study_1_weight,
        case_study_2_weight,
        case_study_3_weight,
        
        has_basic_knowledge,
        has_specific_knowledge_1,
        has_specific_knowledge_2,
        has_specific_knowledge_3,
        has_discursive,
        has_case_study_1,
        has_case_study_2,
        has_case_study_3
      `)
      .eq('id', concursoId)
      .single();
    
    if (concursoError) {
      console.error('Error fetching concurso details:', concursoError);
    }
    
    // Modificando para usar uma abordagem alternativa que evite a ambiguidade de ID
    const { data, error } = await supabase
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
        users_profiles(name, avatar_url)
      `)
      .eq('concurso_id', concursoId)
      .order('score', { ascending: false });
      
    if (error) {
      console.error('Error fetching rankings:', error);
      return [];
    }
    
    // Se não há rankings, retornar array vazio
    if (!data || data.length === 0) {
      return [];
    }
    
    // Log data for debugging
    if (data.length > 0) {
      const firstRanking = data[0];
      console.log('First ranking data:', {
        id: firstRanking.id,
        user_id: firstRanking.user_id,
        score: firstRanking.score,
        profile: firstRanking.users_profiles
      });
    }
    
    // Formatar os dados do ranking com posições
    const formattedRankings = data.map((ranking, index) => {
      // Corrigir o problema de TypeScript aqui
      // Verificando corretamente se users_profiles é um array ou um objeto individual
      const userProfile = Array.isArray(ranking.users_profiles) ? 
                        ranking.users_profiles[0] : 
                        ranking.users_profiles;
      
      const name = userProfile?.name || 'Usuário Anônimo';
      const avatarUrl = userProfile?.avatar_url || null;
      
      // Check if candidate meets minimum score requirements (if enabled)
      let isDisqualified = false;
      let basicScoreFailed = false;
      let specific1ScoreFailed = false;
      let specific2ScoreFailed = false;
      let specific3ScoreFailed = false;
      let discursiveScoreFailed = false;
      let caseStudy1Failed = false;
      let caseStudy2Failed = false;
      let caseStudy3Failed = false;
      
      if (concurso?.has_minimum_score) {
        const totalScore = ranking.score || 0;
        
        // Check total minimum score
        if (concurso.total_minimum_score > 0) {
          const minimumRequired = concurso.total_minimum_score;
          
          if (totalScore < minimumRequired) {
            isDisqualified = true;
          }
        }
        
        // Check section-specific minimum scores
        if (concurso.has_basic_knowledge && concurso.basic_knowledge_minimum_score > 0) {
          const sectionScore = ranking.weighted_basic_score || 0;
          if (sectionScore < concurso.basic_knowledge_minimum_score) {
            basicScoreFailed = true;
            isDisqualified = true;
          }
        }
        
        if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_minimum_score > 0) {
          const sectionScore = ranking.weighted_specific_1_score || 0;
          if (sectionScore < concurso.specific_knowledge_1_minimum_score) {
            specific1ScoreFailed = true;
            isDisqualified = true;
          }
        }
        
        if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_minimum_score > 0) {
          const sectionScore = ranking.weighted_specific_2_score || 0;
          if (sectionScore < concurso.specific_knowledge_2_minimum_score) {
            specific2ScoreFailed = true;
            isDisqualified = true;
          }
        }
        
        if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_minimum_score > 0) {
          const sectionScore = ranking.weighted_specific_3_score || 0;
          if (sectionScore < concurso.specific_knowledge_3_minimum_score) {
            specific3ScoreFailed = true;
            isDisqualified = true;
          }
        }
        
        if (concurso.has_discursive && concurso.discursive_minimum_score > 0) {
          const sectionScore = ranking.weighted_discursive_score || 0;
          if (sectionScore < concurso.discursive_minimum_score) {
            discursiveScoreFailed = true;
            isDisqualified = true;
          }
        }
        
        if (concurso.has_case_study_1 && concurso.case_study_1_minimum_score > 0) {
          const sectionScore = ranking.weighted_case_study_1_score || 0;
          if (sectionScore < concurso.case_study_1_minimum_score) {
            caseStudy1Failed = true;
            isDisqualified = true;
          }
        }
        
        if (concurso.has_case_study_2 && concurso.case_study_2_minimum_score > 0) {
          const sectionScore = ranking.weighted_case_study_2_score || 0;
          if (sectionScore < concurso.case_study_2_minimum_score) {
            caseStudy2Failed = true;
            isDisqualified = true;
          }
        }
        
        if (concurso.has_case_study_3 && concurso.case_study_3_minimum_score > 0) {
          const sectionScore = ranking.weighted_case_study_3_score || 0;
          if (sectionScore < concurso.case_study_3_minimum_score) {
            caseStudy3Failed = true;
            isDisqualified = true;
          }
        }
      }
      
      return {
        position: index + 1,
        name: name,
        score: ranking.score || 0,
        userId: ranking.user_id,
        avatarUrl: avatarUrl,
        basicKnowledgeScore: ranking.basic_knowledge_score || 0,
        specificKnowledgeScore: ranking.specific_knowledge_score || 0,
        specificKnowledge1Score: ranking.specific_knowledge_1_score || 0,
        specificKnowledge2Score: ranking.specific_knowledge_2_score || 0,
        specificKnowledge3Score: ranking.specific_knowledge_3_score || 0,
        discursiveScore: ranking.discursive_score || 0,
        caseStudy1Score: ranking.case_study_1_score || 0,
        caseStudy2Score: ranking.case_study_2_score || 0,
        caseStudy3Score: ranking.case_study_3_score || 0,
        // Weighted scores
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
        id: ranking.id,
        // Add minimum score status flags
        isDisqualified,
        basicScoreFailed,
        specific1ScoreFailed,
        specific2ScoreFailed,
        specific3ScoreFailed,
        discursiveScoreFailed,
        caseStudy1Failed,
        caseStudy2Failed,
        caseStudy3Failed
      };
    });
    
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
