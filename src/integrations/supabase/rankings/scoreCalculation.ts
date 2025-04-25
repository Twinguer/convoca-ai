import { supabase } from '../client';
import { getExamStructure } from './examStructure';

export const calculateRawScores = async (
  concursoId: string,
  userAnswers: any[]
) => {
  try {
    const { data: answerKey, error: keyError } = await supabase
      .from('answer_keys')
      .select('question_number, answer, is_nullified')
      .eq('concurso_id', concursoId);
    if (keyError) throw keyError;
    if (!answerKey || answerKey.length === 0) {
      throw new Error('Gabarito oficial não encontrado para este concurso');
    }

    console.log(`[calculateRawScores] Número de questões no gabarito: ${answerKey.length}`);
    const nullifiedQuestions = answerKey.filter(q => q.is_nullified);
    console.log(`[calculateRawScores] Questões anuladas: ${nullifiedQuestions.length}`);
    if (nullifiedQuestions.length > 0) {
      console.log('[calculateRawScores] Números das questões anuladas:', 
        nullifiedQuestions.map(q => q.question_number).join(', '));
    }

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

    const { basicEnd, specific1End, specific2End } = getExamStructure(concurso);

    let basicKnowledgeScore = 0;
    let specific1Score = 0;
    let specific2Score = 0;
    let specific3Score = 0;
    let specificKnowledgeScore = 0;

    console.log(`[calculateRawScores] Número de respostas do usuário: ${userAnswers.length}`);

    userAnswers.forEach(userAnswer => {
      const officialAnswer = answerKey.find(
        a => a.question_number === userAnswer.question_number
      );

      if (officialAnswer) {
        const isNullified = officialAnswer.is_nullified;
        const isCorrect = officialAnswer.answer === userAnswer.answer;
        
        console.log(`[calculateRawScores] Questão ${userAnswer.question_number}: ` +
          `Anulada: ${isNullified}, ` +
          `Resposta oficial: ${officialAnswer.answer}, ` +
          `Resposta do usuário: ${userAnswer.answer}, ` +
          `Correta: ${isCorrect}`);

        if (isNullified || isCorrect) {
          if (userAnswer.is_basic_knowledge) {
            basicKnowledgeScore += 1;
          } else if (userAnswer.is_specific_1) {
            specific1Score += 1;
            specificKnowledgeScore += 1;
          } else if (userAnswer.is_specific_2) {
            specific2Score += 1;
            specificKnowledgeScore += 1;
          } else if (userAnswer.is_specific_3) {
            specific3Score += 1;
            specificKnowledgeScore += 1;
          }
        }
      } else {
        console.log(`[calculateRawScores] ALERTA: Questão ${userAnswer.question_number} não encontrada no gabarito oficial`);
      }
    });

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

export const saveUserScores = async (
  rankingId: string, 
  rawScores: any,
  weightedScores: any,
  subjectiveScores: any
) => {
  try {
    const { data, error } = await supabase.rpc('save_scores_transaction', {
      p_ranking_id: rankingId,
      p_raw_scores: rawScores,
      p_weighted_scores: weightedScores,
      p_subjective_scores: subjectiveScores
    });
    
    if (error) throw error;
    
    if (!data.success) {
      throw new Error(data.error || 'Erro ao salvar pontuações');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving user scores:', error);
    throw error;
  }
};

interface RawScores {
  basicKnowledgeScore: number;
  specificKnowledge1Score: number;
  specificKnowledge2Score: number;
  specificKnowledge3Score: number;
}

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

interface SubjectiveScores {
  discursiveScore: number;
  caseStudy1Score: number;
  caseStudy2Score: number;
  caseStudy3Score: number;
}
