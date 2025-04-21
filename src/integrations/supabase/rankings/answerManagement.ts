
import { supabase } from '../client';
import { getExamStructure, getQuestionSection } from './examStructure';

// Função para salvar as respostas do usuário no banco de dados
export const saveUserAnswersData = async (
  rankingId: string,
  concursoId: string,
  answers: { questionNumber: number; answer: string; isBasicKnowledge: boolean }[]
) => {
  try {
    // Carregue os dados do concurso para determinar as faixas das seções
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

    // Preparar os dados de resposta com as marcações corretas de seção
    const answersData = answers.map(a => {
      const qNum = a.questionNumber;
      const section = getQuestionSection(qNum, basicEnd, specific1End, specific2End);

      return {
        user_ranking_id: rankingId,
        question_number: qNum,
        answer: a.answer,
        is_basic_knowledge: section === 'basic',
        is_specific_1: section === 'specific1',
        is_specific_2: section === 'specific2',
        is_specific_3: section === 'specific3'
      };
    });
    
    // Delete existing answers first
    await supabase
      .from('user_answers')
      .delete()
      .eq('user_ranking_id', rankingId);
    
    // Insert new answers
    const { error: insertError } = await supabase
      .from('user_answers')
      .insert(answersData);
      
    if (insertError) throw insertError;
    
    return answersData;
  } catch (error: any) {
    console.error('Error saving user answers:', error);
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
