
import { supabase } from '@/integrations/supabase/client';

// Defining the Ranking interface to fix TypeScript errors
export interface Ranking {
  position: number;
  name: string;
  score: number;
  userId: string;
  avatarUrl?: string | null;
  // Pontuações subjetivas
  discursiveScore?: number | null;
  caseStudy1Score?: number | null;
  caseStudy2Score?: number | null;
  caseStudy3Score?: number | null;
  // Pontuações subjetivas com peso
  weightedDiscursiveScore?: number | null;
  weightedCaseStudy1Score?: number | null;
  weightedCaseStudy2Score?: number | null;
  weightedCaseStudy3Score?: number | null;
  // Pontuações de disciplinas customizadas
  customDisciplineScores?: { [key: string]: number };
  weightedCustomDisciplineScores?: { [key: string]: number };
  // Campos adicionais
  reservationType: string;
  displayReservation?: string;
  id: string;
  quotaPosition?: number; // Posição dentro da cota - será calculado em runtime
  // Flags para mínimos não atingidos
  belowMinimum?: boolean; // Não atingiu mínimo geral
  belowBlockMinimums?: string[]; // Blocos com mínimo não atingido (IDs)
  belowDisciplineMinimums?: string[]; // Disciplinas com mínimo não atingido (IDs)
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
    
    // Buscar configurações de mínimos do concurso
    const { data: concursoData, error: concursoError } = await supabase
      .from('concursos')
      .select(`
        id,
        total_minimum_score,
        has_minimum_score,
        disciplines
      `)
      .eq('id', concursoId)
      .single();
    
    if (concursoError) {
      console.error('Error fetching concurso data:', concursoError);
    }
    
    // Modificando para usar uma abordagem alternativa que evite a ambiguidade de ID
    const { data, error } = await supabase
      .from('user_rankings')
      .select(`
        id,
        user_id,
        score,
        discursive_score,
        case_study_1_score,
        case_study_2_score,
        case_study_3_score,
        weighted_discursive_score,
        weighted_case_study_1_score,
        weighted_case_study_2_score,
        weighted_case_study_3_score,
        subject_scores,
        customDisciplineScores,
        weightedCustomDisciplineScores,
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
        profile: firstRanking.users_profiles,
        subject_scores: firstRanking.subject_scores,
        customDisciplineScores: firstRanking.customDisciplineScores,
        weightedCustomDisciplineScores: firstRanking.weightedCustomDisciplineScores
      });
    }
    
    // Verificar se o concurso tem mínimo habilitado
    const hasMinimumScoreEnabled = concursoData?.has_minimum_score === true;
    
    // Mínimo geral da prova
    const totalMinimumScore = hasMinimumScoreEnabled ? concursoData?.total_minimum_score || 0 : 0;
    
    console.log('Concurso minimum settings:', {
      hasMinimumScoreEnabled,
      totalMinimumScore,
      disciplines: concursoData?.disciplines
    });
    
    // Extrair mínimos por bloco e disciplina
    const blockMinimums: Record<string, number> = {};
    const disciplineMinimums: Record<string, number> = {};
    
    if (hasMinimumScoreEnabled && concursoData?.disciplines && Array.isArray(concursoData.disciplines)) {
      // Iterar pelos blocos
      concursoData.disciplines.forEach(block => {
        if (block.id && block.minimum_score !== undefined && block.minimum_score > 0) {
          blockMinimums[block.id] = parseFloat(block.minimum_score);
          console.log(`Block minimum found: ${block.id} = ${blockMinimums[block.id]}`);
        }
        
        // Iterar pelas disciplinas
        if (block.disciplines && Array.isArray(block.disciplines)) {
          block.disciplines.forEach(discipline => {
            if (discipline.id && discipline.minimum_score !== undefined && discipline.minimum_score > 0) {
              disciplineMinimums[discipline.type] = parseFloat(discipline.minimum_score);
              console.log(`Discipline minimum found: ${discipline.type} = ${disciplineMinimums[discipline.type]}`);
            }
          });
        }
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
      
      // Parse custom discipline scores from subject_scores jsonb if available
      const subjectScores = ranking.subject_scores || {};
      
      // Usar as pontuações customizadas do JSONB, ou criar um objeto vazio se não existir
      const customDisciplineScores = ranking.customDisciplineScores || {};
      const weightedCustomDisciplineScores = ranking.weightedCustomDisciplineScores || {};
      
      // Se não tiver pontuações customizadas, tentar criar a partir do subject_scores para compatibilidade
      if (Object.keys(customDisciplineScores).length === 0) {
        // Processar pontuações customizadas do subject_scores
        Object.entries(subjectScores).forEach(([key, value]) => {
          // Processar todas as chaves como disciplinas potencialmente customizadas
          if (key !== 'total') { // Ignorar chave especial 'total' se existir
            customDisciplineScores[key] = typeof value === 'number' ? value : Number(value);
            
            // Se não houver pontuações ponderadas, usar as pontuações brutas
            if (Object.keys(weightedCustomDisciplineScores).length === 0) {
              weightedCustomDisciplineScores[key] = customDisciplineScores[key];
            }
          }
        });
      }
      
      // Calcular o total objetivo (excluindo discursivas e estudos de caso)
      // Esta é a principal alteração para resolver o problema
      const totalObjScore = calculateObjectiveScore(ranking, weightedCustomDisciplineScores);
      
      // Verificar se está abaixo do mínimo geral da prova
      const belowMinimum = hasMinimumScoreEnabled && totalMinimumScore > 0 && totalObjScore < totalMinimumScore;
      
      if (belowMinimum) {
        console.log(`User ${ranking.user_id} (${name}) is below minimum: ${totalObjScore} < ${totalMinimumScore}`);
      }
      
      // Verificar mínimos por bloco e disciplina
      const belowBlockMinimums: string[] = [];
      const belowDisciplineMinimums: string[] = [];
      
      // Função auxiliar para agrupar pontuações por bloco
      const getBlockScores = () => {
        const blockScores: Record<string, number> = {};
        
        if (concursoData?.disciplines && Array.isArray(concursoData.disciplines)) {
          concursoData.disciplines.forEach(block => {
            if (block.id && block.disciplines && Array.isArray(block.disciplines)) {
              let blockScore = 0;
              
              // Somar scores das disciplinas deste bloco
              block.disciplines.forEach(discipline => {
                if (discipline.id && discipline.type) {
                  const disciplineScore = weightedCustomDisciplineScores[discipline.type] || 0;
                  blockScore += disciplineScore;
                  
                  // Verificar mínimo da disciplina
                  if (hasMinimumScoreEnabled && disciplineMinimums[discipline.type] > 0 && 
                      disciplineScore < disciplineMinimums[discipline.type]) {
                    belowDisciplineMinimums.push(discipline.type);
                    console.log(`User ${ranking.user_id} (${name}) is below minimum in discipline ${discipline.type}: ${disciplineScore} < ${disciplineMinimums[discipline.type]}`);
                  }
                }
              });
              
              blockScores[block.id] = blockScore;
              
              // Verificar mínimo do bloco
              if (hasMinimumScoreEnabled && blockMinimums[block.id] > 0 && blockScore < blockMinimums[block.id]) {
                belowBlockMinimums.push(block.id);
                console.log(`User ${ranking.user_id} (${name}) is below minimum in block ${block.id}: ${blockScore} < ${blockMinimums[block.id]}`);
              }
            }
          });
        }
        
        return blockScores;
      };
      
      // Calcular scores por bloco
      const blockScores = getBlockScores();
      
      return {
        position: index + 1,
        name: name,
        score: ranking.score || 0,
        userId: ranking.user_id,
        avatarUrl: avatarUrl,
        // Pontuações subjetivas
        discursiveScore: ranking.discursive_score || 0,
        caseStudy1Score: ranking.case_study_1_score || 0,
        caseStudy2Score: ranking.case_study_2_score || 0,
        caseStudy3Score: ranking.case_study_3_score || 0,
        // Pontuações subjetivas com peso
        weightedDiscursiveScore: ranking.weighted_discursive_score || 0,
        weightedCaseStudy1Score: ranking.weighted_case_study_1_score || 0,
        weightedCaseStudy2Score: ranking.weighted_case_study_2_score || 0,
        weightedCaseStudy3Score: ranking.weighted_case_study_3_score || 0,
        // Pontuações de disciplinas customizadas
        customDisciplineScores,
        weightedCustomDisciplineScores,
        // Flags de mínimos não atingidos
        belowMinimum,
        belowBlockMinimums: belowBlockMinimums.length > 0 ? belowBlockMinimums : undefined,
        belowDisciplineMinimums: belowDisciplineMinimums.length > 0 ? belowDisciplineMinimums : undefined,
        // Dados do ranking
        reservationType: ranking.reservation_type || 'Ampla Concorrência',
        displayReservation: getReservationAbbreviation(ranking.reservation_type || 'Ampla Concorrência'),
        id: ranking.id,
        // Não buscamos mais quota_position do banco, será calculado em runtime
      };
    });
    
    return formattedRankings;
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
};

// Nova função auxiliar para calcular pontuação objetiva (excluindo discursivas e estudos de caso)
const calculateObjectiveScore = (ranking: any, weightedCustomDisciplineScores: { [key: string]: number }) => {
  // Se temos pontuações customizadas, usar a soma delas
  if (weightedCustomDisciplineScores && Object.keys(weightedCustomDisciplineScores).length > 0) {
    return Object.values(weightedCustomDisciplineScores).reduce((sum, score) => sum + (score || 0), 0);
  }
  
  // Caso contrário, usar a soma das pontuações básicas/específicas
  return (
    (ranking.weighted_basic_score || 0) +
    (ranking.weighted_specific_1_score || 0) +
    (ranking.weighted_specific_2_score || 0) +
    (ranking.weighted_specific_3_score || 0)
  );
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
