
import { getExamStructure } from "./examStructure";
import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../client";

// Calcula pontuação bruta com base nas respostas e no gabarito
export const calculateRawScores = async (
  concursoId: string,
  userAnswers: any[]
) => {
  try {
    // Obtenha o gabarito oficial com pesos
    const { data: answerKey, error: keyError } = await supabase.rpc(
      'get_official_answer_weights',
      {
        p_concurso_id: concursoId
      }
    );

    if (keyError) throw keyError;
    if (!answerKey || answerKey.length === 0) {
      console.error(
        '[calculateRawScores] Gabarito oficial não encontrado para este concurso'
      );
      
      throw new Error('Gabarito oficial não encontrado para este concurso');
    }

    // Logging para depuração
    console.log(`[calculateRawScores] Número de questões no gabarito: ${Object.keys(answerKey).length}`);
    const nullifiedQuestions = Object.entries(answerKey).filter(([_, q]: [string, any]) => q.anulada);
    console.log(`[calculateRawScores] Questões anuladas: ${nullifiedQuestions.length}`);
    if (nullifiedQuestions.length > 0) {
      console.log('[calculateRawScores] Questões anuladas:', 
        nullifiedQuestions.map(([q, _]) => q).join(', '));
    }

    // Carregue os dados do concurso para determinar as faixas das seções
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select(
        `
          basic_knowledge_questions,
          specific_knowledge_1_questions,
          specific_knowledge_2_questions,
          specific_knowledge_3_questions
        `
      )
      .eq('id', concursoId)
      .single();
    if (concursoError) throw concursoError;

    const { basicEnd, specific1End, specific2End } = getExamStructure(concurso);

    // Inicializa contadores de acertos por seção
    let basicKnowledgeScore = 0;
    let specificKnowledgeScore = 0;
    let specific1Score = 0;
    let specific2Score = 0;
    let specific3Score = 0;

    // Debug log para respostas do usuário
    console.log(`[calculateRawScores] Número de respostas do usuário: ${userAnswers.length}`);

    // Calcula os acertos
    userAnswers.forEach(userAnswer => {
      const questionNumber = userAnswer.question_number;
      const questionKey = `questao${questionNumber}`;
      const officialAnswer = answerKey[questionKey];

      // Verificação detalhada para depuração
      if (officialAnswer) {
        const isNullified = officialAnswer.anulada;
        const isCorrect = officialAnswer.resposta === userAnswer.answer;
        const sectionType = officialAnswer.secao || 'unknown';
        
        console.log(`[calculateRawScores] Questão ${questionNumber}: ` +
          `Anulada: ${isNullified}, ` +
          `Seção: ${sectionType}, ` +
          `Resposta oficial: ${officialAnswer.resposta}, ` +
          `Resposta do usuário: ${userAnswer.answer}, ` +
          `Correta: ${isCorrect}`);

        // Contabiliza acerto se a questão é anulada ou a resposta está correta
        if (isNullified || isCorrect) {
          // Usamos o campo secao (section_type) do gabarito oficial
          const weight = officialAnswer.peso || 1;
          
          if (sectionType === 'basic') {
            basicKnowledgeScore += weight;
          } else if (sectionType === 'specific1') {
            specific1Score += weight;
            specificKnowledgeScore += weight;
          } else if (sectionType === 'specific2') {
            specific2Score += weight;
            specificKnowledgeScore += weight;
          } else if (sectionType === 'specific3') {
            specific3Score += weight;
            specificKnowledgeScore += weight;
          }
          // Caso de fallback usando as flags is_basic_knowledge, etc. (legado)
          else if (userAnswer.is_basic_knowledge) {
            basicKnowledgeScore += weight;
          } else if (userAnswer.is_specific_1) {
            specific1Score += weight;
            specificKnowledgeScore += weight;
          } else if (userAnswer.is_specific_2) {
            specific2Score += weight;
            specificKnowledgeScore += weight;
          } else if (userAnswer.is_specific_3) {
            specific3Score += weight;
            specificKnowledgeScore += weight;
          }
        }
      } else {
        console.log(`[calculateRawScores] ALERTA: Questão ${questionNumber} não encontrada no gabarito oficial`);
      }
    });

    // Log das pontuações calculadas
    console.log(`[calculateRawScores] Pontuações calculadas: ` +
      `Básico: ${basicKnowledgeScore}, ` +
      `Específico total: ${specificKnowledgeScore} ` +
      `(E1: ${specific1Score}, E2: ${specific2Score}, E3: ${specific3Score})`);

    return {
      basicKnowledgeScore,
      specificKnowledgeScore,
      specific1Score,
      specific2Score,
      specific3Score
    };
  } catch (error) {
    console.error('[calculateRawScores] Error calculating raw scores:', error);
    throw error;
  }
};

// Aplica pesos para calcular as pontuações finais
export const applyWeightsToScores = async (
  concursoId: string,
  scores: {
    basicKnowledgeScore: number;
    specificKnowledgeScore: number;
    specific1Score: number;
    specific2Score: number;
    specific3Score: number;
  },
  subjectiveScores: {
    discursiveScore: number;
    caseStudy1Score: number;
    caseStudy2Score: number;
    caseStudy3Score: number;
  }
) => {
  try {    
    // Obtenha os pesos do concurso
    const { data: concursoWithWeights, error: concursoWeightsError } = await supabase
      .from('concursos')
      .select(`
        basic_knowledge_weight,
        specific_knowledge_1_weight,
        specific_knowledge_2_weight,
        specific_knowledge_3_weight,
        discursive_weight,
        case_study_1_weight,
        case_study_2_weight,
        case_study_3_weight
      `)
      .eq('id', concursoId)
      .single();
    if (concursoWeightsError) throw concursoWeightsError;
    
    // Extrai os pesos
    const weights = {
      basicKnowledge: concursoWithWeights?.basic_knowledge_weight || 1,
      specificKnowledge1: concursoWithWeights?.specific_knowledge_1_weight || 1,
      specificKnowledge2: concursoWithWeights?.specific_knowledge_2_weight || 1,
      specificKnowledge3: concursoWithWeights?.specific_knowledge_3_weight || 1,
      discursive: concursoWithWeights?.discursive_weight || 1,
      caseStudy1: concursoWithWeights?.case_study_1_weight || 1,
      caseStudy2: concursoWithWeights?.case_study_2_weight || 1,
      caseStudy3: concursoWithWeights?.case_study_3_weight || 1
    };

    console.log('[applyWeightsToScores] Pesos do concurso:', weights);
    console.log('[applyWeightsToScores] Pontuações brutas:', scores);

    // Aplica os pesos
    const weightedScores = {
      weightedBasicScore: scores.basicKnowledgeScore * weights.basicKnowledge,
      weightedSpecific1Score: scores.specific1Score * weights.specificKnowledge1,
      weightedSpecific2Score: scores.specific2Score * weights.specificKnowledge2,
      weightedSpecific3Score: scores.specific3Score * weights.specificKnowledge3,
      weightedDiscursiveScore: subjectiveScores.discursiveScore * weights.discursive,
      weightedCaseStudy1Score: subjectiveScores.caseStudy1Score * weights.caseStudy1,
      weightedCaseStudy2Score: subjectiveScores.caseStudy2Score * weights.caseStudy2,
      weightedCaseStudy3Score: subjectiveScores.caseStudy3Score * weights.caseStudy3
    };

    console.log('[applyWeightsToScores] Pontuações ponderadas:', weightedScores);

    // Calcula o score total
    const totalScore =
      weightedScores.weightedBasicScore +
      weightedScores.weightedSpecific1Score +
      weightedScores.weightedSpecific2Score +
      weightedScores.weightedSpecific3Score +
      weightedScores.weightedDiscursiveScore +
      weightedScores.weightedCaseStudy1Score +
      weightedScores.weightedCaseStudy2Score +
      weightedScores.weightedCaseStudy3Score;

    return {
      ...weightedScores,
      totalScore
    };
  } catch (error) {
    console.error('Error applying weights to scores:', error);
    throw error;
  }
};

// Salva todas as pontuações do usuário (brutas e ponderadas)
export const saveUserScores = async (
  rankingId: string,
  rawScores: {
    basicKnowledgeScore: number;
    specificKnowledgeScore: number;
    specific1Score: number;
    specific2Score: number;
    specific3Score: number;
  },
  subjectiveScores: {
    discursiveScore: number;
    caseStudy1Score: number;
    caseStudy2Score: number;
    caseStudy3Score: number;
  },
  weightedScores: {
    weightedBasicScore: number;
    weightedSpecific1Score: number;
    weightedSpecific2Score: number;
    weightedSpecific3Score: number;
    weightedDiscursiveScore: number;
    weightedCaseStudy1Score: number;
    weightedCaseStudy2Score: number;
    weightedCaseStudy3Score: number;
    totalScore: number;
  }
) => {
  try {
    console.log('[saveUserScores] Salvando pontuações para ranking:', rankingId);
    console.log('[saveUserScores] Pontuações brutas:', rawScores);
    console.log('[saveUserScores] Pontuações ponderadas:', weightedScores);
    
    // Atualiza o ranking do usuário com todas as pontuações
    const { error: updateError } = await supabase
      .from('user_rankings')
      .update({
        // Pontuações brutas
        basic_knowledge_score: rawScores.basicKnowledgeScore,
        specific_knowledge_score: rawScores.specificKnowledgeScore,
        specific_knowledge_1_score: rawScores.specific1Score,
        specific_knowledge_2_score: rawScores.specific2Score,
        specific_knowledge_3_score: rawScores.specific3Score,
        discursive_score: subjectiveScores.discursiveScore,
        case_study_1_score: subjectiveScores.caseStudy1Score,
        case_study_2_score: subjectiveScores.caseStudy2Score,
        case_study_3_score: subjectiveScores.caseStudy3Score,
        
        // Pontuações ponderadas
        weighted_basic_score: weightedScores.weightedBasicScore,
        weighted_specific_1_score: weightedScores.weightedSpecific1Score,
        weighted_specific_2_score: weightedScores.weightedSpecific2Score,
        weighted_specific_3_score: weightedScores.weightedSpecific3Score,
        weighted_discursive_score: weightedScores.weightedDiscursiveScore,
        weighted_case_study_1_score: weightedScores.weightedCaseStudy1Score,
        weighted_case_study_2_score: weightedScores.weightedCaseStudy2Score,
        weighted_case_study_3_score: weightedScores.weightedCaseStudy3Score,

        // Pontuação final
        score: weightedScores.totalScore,        
        updated_at: new Date().toISOString()
      })
      .eq('id', rankingId);
      
    if (updateError) throw updateError;
    
    return true;
  } catch (error) {
    console.error('Error saving user scores:', error);
    throw error;
  }
};

// Helper function to update section_type in official_answer_weights
export const updateSectionTypeForConcurso = async (concursoId: string) => {
  try {
    console.log('Updating section_type for concurso:', concursoId);
    
    // Get concurso structure
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select(`
        basic_knowledge_questions,
        specific_knowledge_1_questions,
        specific_knowledge_2_questions,
        specific_knowledge_3_questions
      `)
      .eq('id', concursoId)
      .single();
      
    if (concursoError) throw concursoError;
    
    // Calculate section ranges
    const basicEnd = concurso.basic_knowledge_questions || 0;
    const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
    const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);
    
    // Update section_type for all answers
    // Basic knowledge questions
    if (basicEnd > 0) {
      const { error: basicUpdateError } = await supabase
        .from('official_answer_weights')
        .update({ section_type: 'basic' })
        .eq('concurso_id', concursoId)
        .lte('question_number', basicEnd);
        
      if (basicUpdateError) {
        console.error('Error updating basic knowledge section_type:', basicUpdateError);
        return {
          success: false,
          error: basicUpdateError.message
        };
      }
    }
    
    // Specific knowledge 1 questions
    if (concurso.specific_knowledge_1_questions > 0) {
      const { error: specific1UpdateError } = await supabase
        .from('official_answer_weights')
        .update({ section_type: 'specific1' })
        .eq('concurso_id', concursoId)
        .gt('question_number', basicEnd)
        .lte('question_number', specific1End);
        
      if (specific1UpdateError) {
        console.error('Error updating specific1 section_type:', specific1UpdateError);
        return {
          success: false,
          error: specific1UpdateError.message
        };
      }
    }
    
    // Specific knowledge 2 questions
    if (concurso.specific_knowledge_2_questions > 0) {
      const { error: specific2UpdateError } = await supabase
        .from('official_answer_weights')
        .update({ section_type: 'specific2' })
        .eq('concurso_id', concursoId)
        .gt('question_number', specific1End)
        .lte('question_number', specific2End);
        
      if (specific2UpdateError) {
        console.error('Error updating specific2 section_type:', specific2UpdateError);
        return {
          success: false,
          error: specific2UpdateError.message
        };
      }
    }
    
    // Specific knowledge 3 questions
    if (concurso.specific_knowledge_3_questions > 0) {
      const { error: specific3UpdateError } = await supabase
        .from('official_answer_weights')
        .update({ section_type: 'specific3' })
        .eq('concurso_id', concursoId)
        .gt('question_number', specific2End);
        
      if (specific3UpdateError) {
        console.error('Error updating specific3 section_type:', specific3UpdateError);
        return {
          success: false,
          error: specific3UpdateError.message
        };
      }
    }
    
    return {
      success: true
    };
  } catch (error: any) {
    console.error('Error updating section_type:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
