
import { supabase } from '../client';
import { getSectionTypeForQuestion, sanitizeSectionType } from './examStructure';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';
import { RPCValidator } from '@/utils/rpcValidator';

// FUNÇÃO ATUALIZADA PARA TRABALHAR COM DADOS CONSOLIDADOS
export const saveUserAnswersData = async (
  rankingId: string,
  concursoId: string,
  answers: { questionNumber: number; answer: string }[]
) => {
  try {
    devLog.log('[answerManagement] Redirecionando para estrutura consolidada...');
    
    // Carregar dados do concurso para determinar as faixas das seções
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
    
    if (concursoError) throw concursoError;

    // Preparar dados com estrutura consolidada
    const answersArray = answers.map(a => {
      const qNum = a.questionNumber;
      const sectionType = getSectionTypeForQuestion(concurso, qNum);
      
      return {
        questionNumber: qNum,
        answer: a.answer,
        sectionType,
        answerData: {
          objective_answer: a.answer,
          timestamp: new Date().toISOString()
        }
      };
    });
    
    devLog.log('[answerManagement] Dados preparados para estrutura consolidada:', answersArray);

    // ✅ VALIDAÇÃO: Validar todos os inputs antes de enviar
    let validatedConcursoId: string;
    let validatedBookletId: string | null;
    let validatedAnswers: Record<string, string>;
    let validatedSubjectiveScores: any;
    let validatedEditCount: number;
    
    try {
      validatedConcursoId = RPCValidator.validateUUID(concursoId, 'ID do concurso');
      validatedBookletId = RPCValidator.validateBookletId('default');
      
      // Converter respostas para formato JSONB
      const answersObject: { [key: string]: string } = {};
      answersArray.forEach(answer => {
        answersObject[answer.questionNumber.toString()] = answer.answer;
      });
      validatedAnswers = RPCValidator.validateAnswersJSONB(answersObject);
      
      // Validar pontuações subjetivas
      validatedSubjectiveScores = RPCValidator.validateSubjectiveScores({
        discursive: 0,
        case_study_1: 0,
        case_study_2: 0,
        case_study_3: 0
      });
      
      // Validar contador de edições
      validatedEditCount = RPCValidator.validateEditCount(0);
    } catch (validationError: any) {
      devLog.error('[answerManagement] Validation error:', validationError);
      throw new Error(validationError.message || 'Dados inválidos');
    }

    // Usar a nova função RPC consolidada com dados validados
    const { data, error } = await supabase.rpc('save_user_answers_with_booklet', {
      p_concurso_id: validatedConcursoId,
      p_booklet_id: validatedBookletId,
      p_answers: validatedAnswers,
      p_discursive_score: validatedSubjectiveScores.discursive,
      p_case_study_1_score: validatedSubjectiveScores.case_study_1,
      p_case_study_2_score: validatedSubjectiveScores.case_study_2,
      p_case_study_3_score: validatedSubjectiveScores.case_study_3,
      p_current_edit_count: validatedEditCount
    });
    
    if (error) {
      devLog.error('[answerManagement] Erro na função RPC consolidada:', error);
      throw error;
    }
    
    devLog.log('[answerManagement] Respostas salvas com sucesso via estrutura consolidada');
    return answersArray;
  } catch (error: any) {
    devLog.error('[answerManagement] Erro ao salvar respostas:', error);
    throw error;
  }
};

// Função para buscar respostas usando estrutura consolidada
export const fetchUserAnswers = async (rankingId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_answers')
      .select('answers_data')
      .eq('user_ranking_id', rankingId)
      .is('question_number', null)
      .single();
      
    if (error) {
      devLog.error('[answerManagement] Error fetching consolidated answers:', error);
      return [];
    }
    
    if (!data?.answers_data) {
      return [];
    }
    
    // Converter estrutura consolidada para formato legado para compatibilidade
    const consolidatedData = data.answers_data;
    const legacyAnswers: any[] = [];
    
    if (consolidatedData.booklets) {
      Object.values(consolidatedData.booklets).forEach((booklet: any) => {
        if (booklet.answers) {
          Object.entries(booklet.answers).forEach(([questionNum, answer]) => {
            legacyAnswers.push({
              user_ranking_id: rankingId,
              question_number: parseInt(questionNum),
              answer: answer
            });
          });
        }
      });
    }
    
    return legacyAnswers;
  } catch (error) {
    devLog.error('[answerManagement] Error fetching user answers:', error);
    return [];
  }
};
