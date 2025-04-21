
import { supabase } from '../client';
import { loadExamStructure } from './examStructure';

/**
 * Interface para pontuações brutas (contagem de acertos)
 */
interface RawScores {
  basicKnowledgeScore: number;
  specificKnowledgeScore: number; // Soma dos específicos (compatibilidade)
  specific1Score: number;
  specific2Score: number;
  specific3Score: number;
}

/**
 * Interface para pontuações subjetivas
 */
interface SubjectiveScores {
  discursiveScore: number;
  caseStudy1Score: number;
  caseStudy2Score: number;
  caseStudy3Score: number;
}

/**
 * Interface para pontuações ponderadas
 */
interface WeightedScores {
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

/**
 * Calcula pontuação bruta com base nas respostas e no gabarito
 */
export const calculateRawScores = async (
  concursoId: string,
  userAnswers: any[]
): Promise<RawScores> => {
  try {
    console.log(`Calculando scores brutos para concurso ${concursoId}`);
    
    // Obtenha o gabarito oficial
    const { data: answerKey, error: keyError } = await supabase
      .from('answer_keys')
      .select('*, is_nullified')
      .eq('concurso_id', concursoId);
    if (keyError) throw keyError;
    if (!answerKey || answerKey.length === 0) {
      throw new Error('Gabarito oficial não encontrado para este concurso');
    }

    // Carregue a estrutura do exame
    const structure = await loadExamStructure(concursoId);

    // Inicializa contadores de acertos por seção
    let basicKnowledgeScore = 0;
    let specific1Score = 0;
    let specific2Score = 0;
    let specific3Score = 0;

    // Para cada resposta do usuário, verifica o gabarito e incrementa apenas na seção correta
    userAnswers.forEach(userAnswer => {
      const officialAnswer = answerKey.find(
        a => a.question_number === userAnswer.question_number
      );

      // Só soma ponto se a resposta está correta ou a questão foi anulada
      if (officialAnswer && (officialAnswer.is_nullified || officialAnswer.answer === userAnswer.answer)) {
        const qNum = userAnswer.question_number;
        
        // Determina a seção por faixas de números
        if (qNum <= structure.basicEnd) {
          basicKnowledgeScore += 1;
        } else if (qNum <= structure.specific1End) {
          specific1Score += 1;
        } else if (qNum <= structure.specific2End) {
          specific2Score += 1;
        } else if (qNum <= structure.specific3End) {
          specific3Score += 1;
        }
      }
    });

    // Soma total dos específicos (para compatibilidade)
    const specificKnowledgeScore = specific1Score + specific2Score + specific3Score;

    return {
      basicKnowledgeScore,
      specificKnowledgeScore,
      specific1Score,
      specific2Score,
      specific3Score
    };
  } catch (error) {
    console.error('Error calculating raw scores:', error);
    throw error;
  }
};

/**
 * Aplica pesos para calcular as pontuações finais
 */
export const applyWeightsToScores = async (
  concursoId: string,
  rawScores: RawScores,
  subjectiveScores: SubjectiveScores
): Promise<WeightedScores> => {
  try {
    console.log(`Aplicando pesos para concurso ${concursoId}`);
    
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
    
    // Log de debug
    console.log('Pesos obtidos do banco:', concursoWithWeights);
    console.log('Pontuações brutas:', rawScores);
    console.log('Pontuações subjetivas:', subjectiveScores);
    
    // Extrai os pesos (valores padrão são 1)
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

    // Log de pesos aplicados
    console.log('Pesos que serão aplicados:', weights);

    // Aplica os pesos
    const weightedScores = {
      weightedBasicScore: rawScores.basicKnowledgeScore * weights.basicKnowledge,
      weightedSpecific1Score: rawScores.specific1Score * weights.specificKnowledge1,
      weightedSpecific2Score: rawScores.specific2Score * weights.specificKnowledge2,
      weightedSpecific3Score: rawScores.specific3Score * weights.specificKnowledge3,
      weightedDiscursiveScore: subjectiveScores.discursiveScore * weights.discursive,
      weightedCaseStudy1Score: subjectiveScores.caseStudy1Score * weights.caseStudy1,
      weightedCaseStudy2Score: subjectiveScores.caseStudy2Score * weights.caseStudy2,
      weightedCaseStudy3Score: subjectiveScores.caseStudy3Score * weights.caseStudy3
    };

    // Calcula o score total (soma das pontuações ponderadas)
    const totalScore = 
      weightedScores.weightedBasicScore + 
      weightedScores.weightedSpecific1Score + 
      weightedScores.weightedSpecific2Score + 
      weightedScores.weightedSpecific3Score +
      weightedScores.weightedDiscursiveScore +
      weightedScores.weightedCaseStudy1Score +
      weightedScores.weightedCaseStudy2Score +
      weightedScores.weightedCaseStudy3Score;

    // Log de scores ponderados
    console.log('Scores ponderados calculados:', { ...weightedScores, totalScore });

    return {
      ...weightedScores,
      totalScore
    };
  } catch (error) {
    console.error('Error applying weights to scores:', error);
    throw error;
  }
};

/**
 * Salva todas as pontuações do usuário (brutas e ponderadas)
 */
export const saveUserScores = async (
  rankingId: string,
  rawScores: RawScores,
  subjectiveScores: SubjectiveScores,
  weightedScores: WeightedScores
): Promise<boolean> => {
  try {
    console.log(`Salvando scores para ranking ${rankingId}`);
    
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
        
        // Flag e timestamp
        all_questions_answered: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', rankingId);
      
    if (updateError) throw updateError;
    
    console.log(`Scores salvos com sucesso para ranking ${rankingId}`);
    return true;
  } catch (error) {
    console.error('Error saving user scores:', error);
    throw error;
  }
};
