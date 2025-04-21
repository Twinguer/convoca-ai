
import { supabase } from '../client';
import { loadExamStructure } from './examStructure';

/**
 * Salva as respostas do usuário no banco de dados
 */
export const saveUserAnswersData = async (
  rankingId: string,
  concursoId: string,
  answers: { questionNumber: number; answer: string; isBasicKnowledge?: boolean }[]
) => {
  try {
    console.log(`Salvando ${answers.length} respostas para ranking ${rankingId}`);
    
    // Carregue a estrutura do exame
    const structure = await loadExamStructure(concursoId);

    // Preparar os dados de resposta com as marcações corretas de seção
    const answersData = answers.map(a => {
      const qNum = a.questionNumber;
      
      // Determina as flags de seção baseadas no número da questão
      const isBasic = qNum <= structure.basicEnd;
      const isSpecific1 = qNum > structure.basicEnd && qNum <= structure.specific1End;
      const isSpecific2 = qNum > structure.specific1End && qNum <= structure.specific2End;
      const isSpecific3 = qNum > structure.specific2End && qNum <= structure.specific3End;

      return {
        user_ranking_id: rankingId,
        question_number: qNum,
        answer: a.answer,
        is_basic_knowledge: isBasic,
        is_specific_1: isSpecific1,
        is_specific_2: isSpecific2,
        is_specific_3: isSpecific3
      };
    });
    
    // Log para debug
    console.log('Dados de respostas preparados para salvar:', answersData);
    
    // Exclui respostas existentes primeiro
    const { error: deleteError } = await supabase
      .from('user_answers')
      .delete()
      .eq('user_ranking_id', rankingId);
      
    if (deleteError) {
      console.error('Erro ao excluir respostas existentes:', deleteError);
      throw deleteError;
    }
    
    // Verifica se há respostas para inserir
    if (answersData.length === 0) {
      console.log('Nenhuma resposta para salvar');
      return [];
    }
    
    // Insere novas respostas
    const { data, error: insertError } = await supabase
      .from('user_answers')
      .insert(answersData)
      .select();
      
    if (insertError) {
      console.error('Erro ao inserir novas respostas:', insertError);
      throw insertError;
    }
    
    console.log(`${answersData.length} respostas salvas com sucesso`);
    return data || [];
  } catch (error: any) {
    console.error('Error saving user answers:', error);
    throw error;
  }
};

/**
 * Busca as respostas de um usuário
 */
export const fetchUserAnswers = async (rankingId: string) => {
  try {
    console.log(`Buscando respostas para ranking ${rankingId}`);
    
    const { data, error } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', rankingId);
      
    if (error) throw error;
    
    console.log(`${data?.length || 0} respostas encontradas`);
    return data || [];
  } catch (error) {
    console.error('Error fetching user answers:', error);
    return [];
  }
};

/**
 * Busca e processa o gabarito oficial de um concurso
 */
export const fetchOfficialAnswerKey = async (concursoId: string) => {
  try {
    console.log(`Buscando gabarito oficial para concurso ${concursoId}`);
    
    const { data, error } = await supabase
      .from('answer_keys')
      .select('*')
      .eq('concurso_id', concursoId);
      
    if (error) throw error;
    
    console.log(`${data?.length || 0} itens de gabarito encontrados`);
    return data || [];
  } catch (error) {
    console.error('Error fetching official answer key:', error);
    return [];
  }
};

/**
 * Recupera as pontuações subjetivas de um ranking
 */
export const fetchSubjectiveScores = async (rankingId: string) => {
  try {
    console.log(`Buscando pontuações subjetivas para ranking ${rankingId}`);
    
    const { data, error } = await supabase
      .from('user_rankings')
      .select(`
        discursive_score,
        case_study_1_score,
        case_study_2_score,
        case_study_3_score
      `)
      .eq('id', rankingId)
      .single();
      
    if (error) throw error;
    
    // Formata os dados para o formato esperado
    return {
      discursiveScore: data?.discursive_score || 0,
      caseStudy1Score: data?.case_study_1_score || 0,
      caseStudy2Score: data?.case_study_2_score || 0,
      caseStudy3Score: data?.case_study_3_score || 0
    };
  } catch (error) {
    console.error('Error fetching subjective scores:', error);
    return {
      discursiveScore: 0,
      caseStudy1Score: 0,
      caseStudy2Score: 0,
      caseStudy3Score: 0
    };
  }
};
