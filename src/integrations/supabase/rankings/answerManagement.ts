
import { supabase } from '../client';
import { getExamStructure, getSectionTypeForQuestion } from './examStructure';

// Função para salvar as respostas do usuário no banco de dados
export const saveUserAnswersData = async (
  rankingId: string,
  concursoId: string,
  answers: { questionNumber: number; answer: string }[]
) => {
  try {
    // Carregue os dados do concurso para determinar as faixas das seções
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select(`
        *
      `)
      .eq('id', concursoId)
      .single();
    if (concursoError) throw concursoError;

    // Preparar os dados de resposta com as marcações corretas de seção
    const answersData = answers.map(a => {
      const qNum = a.questionNumber;
      // Determinar o tipo de seção para esta questão
      const sectionType = getSectionTypeForQuestion(concurso, qNum);

      return {
        user_ranking_id: rankingId,
        question_number: qNum,
        answer: a.answer,
        is_basic_knowledge: sectionType === 'basic',
        is_specific_1: sectionType === 'specific1',
        is_specific_2: sectionType === 'specific2',
        is_specific_3: sectionType === 'specific3'
      };
    });
    
    console.log('Dados de respostas preparados para salvar:', answersData);

    // Primeiro exclui todas as respostas existentes
    const { error: deleteError } = await supabase
      .from('user_answers')
      .delete()
      .eq('user_ranking_id', rankingId);
    
    if (deleteError) {
      console.error('Erro ao excluir respostas existentes:', deleteError);
      throw deleteError;
    }
    
    console.log('Respostas anteriores excluídas com sucesso');
    
    // Insere novas respostas apenas se houver respostas para inserir
    if (answersData.length > 0) {
      const { error: insertError } = await supabase
        .from('user_answers')
        .insert(answersData);
        
      if (insertError) {
        console.error('Erro ao inserir novas respostas:', insertError);
        throw insertError;
      }
      
      console.log('Novas respostas inseridas com sucesso');
    }
    
    return answersData;
  } catch (error: any) {
    console.error('Erro ao salvar respostas do usuário:', error);
    throw error;
  }
};

// Função para buscar as respostas de um usuário
export const fetchUserAnswers = async (rankingId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', rankingId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user answers:', error);
    return [];
  }
};
