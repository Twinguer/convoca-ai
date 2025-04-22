
import { supabase } from '../client';
import { getExamStructure } from './examStructure';

// Interface para pontuações brutas
interface RawScores {
  basicKnowledgeScore: number;
  specificKnowledgeScore: number;
  specific1Score: number;
  specific2Score: number;
  specific3Score: number;
}

// Interface para pontuações subjetivas
interface SubjectiveScores {
  discursiveScore: number;
  caseStudy1Score: number;
  caseStudy2Score: number;
  caseStudy3Score: number;
}

// Interface para pontuações ponderadas
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

// Interface para respostas do usuário
interface UserAnswer {
  question_number: number;
  answer: string;
  is_basic_knowledge: boolean;
  is_specific_1: boolean;
  is_specific_2: boolean;
  is_specific_3: boolean;
}

// Interface para gabarito oficial
interface AnswerKey {
  question_number: number;
  answer: string;
  is_nullified: boolean;
}

// Calcula pontuação bruta com base nas respostas e no gabarito
export const calculateRawScores = async (
  concursoId: string,
  userAnswers: UserAnswer[]
): Promise<RawScores> => {
  try {
    console.log(`[calculateRawScores] Iniciando cálculo de pontuações brutas para concurso ${concursoId}`);
    console.log(`[calculateRawScores] Recebidas ${userAnswers.length} respostas de usuário`);
    
    // Obtenha o gabarito oficial
    const { data: answerKey, error: keyError } = await supabase
      .from('answer_keys')
      .select('question_number, answer, is_nullified')
      .eq('concurso_id', concursoId);
      
    if (keyError) {
      console.error('[calculateRawScores] Erro ao buscar gabarito:', keyError);
      throw keyError;
    }
    
    if (!answerKey || answerKey.length === 0) {
      console.error('[calculateRawScores] Gabarito oficial não encontrado para o concurso', concursoId);
      throw new Error('Gabarito oficial não encontrado para este concurso');
    }

    // Logging para depuração
    console.log(`[calculateRawScores] Número de questões no gabarito: ${answerKey.length}`);
    
    const nullifiedQuestions = answerKey.filter(q => q.is_nullified);
    console.log(`[calculateRawScores] Questões anuladas: ${nullifiedQuestions.length}`);
    
    if (nullifiedQuestions.length > 0) {
      console.log('[calculateRawScores] Números das questões anuladas:', 
        nullifiedQuestions.map(q => q.question_number).join(', '));
    }

    // Carregue os dados do concurso
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
      
    if (concursoError) {
      console.error('[calculateRawScores] Erro ao buscar estrutura do concurso:', concursoError);
      throw concursoError;
    }

    // Obter estrutura do exame
    const examStructure = getExamStructure(concurso);
    console.log('[calculateRawScores] Estrutura do exame:', examStructure);

    // Inicializa contadores de acertos por seção
    let basicKnowledgeScore = 0;
    let specificKnowledgeScore = 0;
    let specific1Score = 0;
    let specific2Score = 0;
    let specific3Score = 0;

    // Criar um mapa para facilitar busca das respostas oficiais
    const officialAnswersMap = new Map<number, AnswerKey>();
    answerKey.forEach(answer => {
      officialAnswersMap.set(answer.question_number, answer);
    });

    // Verifica se há respostas faltando no gabarito
    const userQuestionNumbers = userAnswers.map(a => a.question_number);
    const maxQuestionNumber = Math.max(...userQuestionNumbers);
    
    for (let i = 1; i <= maxQuestionNumber; i++) {
      if (!officialAnswersMap.has(i)) {
        console.warn(`[calculateRawScores] ALERTA: Questão ${i} não encontrada no gabarito oficial`);
      }
    }

    // Calcula os acertos com verificação detalhada
    userAnswers.forEach(userAnswer => {
      const officialAnswer = officialAnswersMap.get(userAnswer.question_number);

      if (officialAnswer) {
        const isNullified = officialAnswer.is_nullified;
        const isCorrect = officialAnswer.answer.toUpperCase() === userAnswer.answer.toUpperCase();
        
        // Log detalhado da verificação de cada resposta
        console.log(`[calculateRawScores] Questão ${userAnswer.question_number}: ` +
          `Anulada: ${isNullified}, ` +
          `Resp. oficial: ${officialAnswer.answer}, ` +
          `Resp. usuário: ${userAnswer.answer}, ` +
          `Correta: ${isCorrect}, ` +
          `Tipo: ${userAnswer.is_basic_knowledge ? 'Básico' : ''}` +
          `${userAnswer.is_specific_1 ? 'Específico1' : ''}` +
          `${userAnswer.is_specific_2 ? 'Específico2' : ''}` +
          `${userAnswer.is_specific_3 ? 'Específico3' : ''}`);

        // Contabiliza acerto se a questão é anulada ou a resposta está correta
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
        console.error(`[calculateRawScores] ERRO: Questão ${userAnswer.question_number} não encontrada no gabarito oficial`);
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
  scores: RawScores,
  subjectiveScores: SubjectiveScores
): Promise<WeightedScores> => {
  try {
    console.log(`[applyWeightsToScores] Aplicando pesos às pontuações para concurso ${concursoId}`);
    
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
      
    if (concursoWeightsError) {
      console.error('[applyWeightsToScores] Erro ao buscar pesos:', concursoWeightsError);
      throw concursoWeightsError;
    }
    
    // Extrai os pesos com valores padrão se não estiverem definidos
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
    
    console.log('[applyWeightsToScores] Pesos obtidos:', weights);
    console.log('[applyWeightsToScores] Pontuações a serem ponderadas:', 
      { objetivas: scores, subjetivas: subjectiveScores });

    // Calcula as pontuações ponderadas
    const weightedScores: WeightedScores = {
      weightedBasicScore: scores.basicKnowledgeScore * weights.basicKnowledge,
      weightedSpecific1Score: scores.specific1Score * weights.specificKnowledge1,
      weightedSpecific2Score: scores.specific2Score * weights.specificKnowledge2,
      weightedSpecific3Score: scores.specific3Score * weights.specificKnowledge3,
      weightedDiscursiveScore: subjectiveScores.discursiveScore * weights.discursive,
      weightedCaseStudy1Score: subjectiveScores.caseStudy1Score * weights.caseStudy1,
      weightedCaseStudy2Score: subjectiveScores.caseStudy2Score * weights.caseStudy2,
      weightedCaseStudy3Score: subjectiveScores.caseStudy3Score * weights.caseStudy3,
      totalScore: 0 // Inicializado aqui e calculado abaixo
    };

    // Calcula o score total somando todas as pontuações ponderadas
    weightedScores.totalScore = 
      weightedScores.weightedBasicScore + 
      weightedScores.weightedSpecific1Score + 
      weightedScores.weightedSpecific2Score + 
      weightedScores.weightedSpecific3Score +
      weightedScores.weightedDiscursiveScore +
      weightedScores.weightedCaseStudy1Score +
      weightedScores.weightedCaseStudy2Score +
      weightedScores.weightedCaseStudy3Score;
    
    console.log('[applyWeightsToScores] Pontuações ponderadas calculadas:', weightedScores);

    return weightedScores;
    
  } catch (error) {
    console.error('[applyWeightsToScores] Erro ao aplicar pesos às pontuações:', error);
    throw error;
  }
};

// Função para salvar pontuações via RPC
export const saveUserScores = async (
  rankingId: string, 
  rawScores: RawScores,
  weightedScores: WeightedScores,
  subjectiveScores: SubjectiveScores
): Promise<boolean> => {
  try {
    console.log(`[saveUserScores] Salvando pontuações para ranking ${rankingId}`);
    
    const { data, error } = await supabase.rpc('save_scores_transaction', {
      p_ranking_id: rankingId,
      p_raw_scores: rawScores,
      p_weighted_scores: weightedScores,
      p_subjective_scores: subjectiveScores
    });
    
    if (error) {
      console.error('[saveUserScores] Erro na chamada RPC:', error);
      throw error;
    }
    
    if (!data.success) {
      console.error('[saveUserScores] RPC retornou erro:', data.error);
      throw new Error(data.error || 'Erro ao salvar pontuações');
    }
    
    console.log(`[saveUserScores] Pontuações salvas com sucesso para ranking ${rankingId}`);
    return true;
    
  } catch (error) {
    console.error('[saveUserScores] Erro ao salvar pontuações do usuário:', error);
    throw error;
  }
};
