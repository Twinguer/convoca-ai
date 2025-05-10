
import { supabase } from '../client';
import { getExamStructure, getSectionTypeForQuestion } from './examStructure';
import { Concurso } from '@/types/concursos';

// Função para salvar as respostas do usuário no banco de dados
export const saveUserAnswersData = async (
  rankingId: string,
  concursoId: string,
  answers: { questionNumber: number; answer: string }[]
) => {
  try {
    // Carregue os dados do concurso para determinar as seções
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
      
    if (concursoError) throw concursoError;

    // Preparar os dados de resposta com as marcações corretas de seção
    const answersData = answers.map(a => {
      const qNum = a.questionNumber;
      const sectionType = getSectionTypeForQuestion(concurso, qNum);
      
      return {
        user_ranking_id: rankingId,
        question_number: qNum,
        answer: a.answer,
        is_basic_knowledge: sectionType === 'basic',
        is_specific_1: sectionType === 'specific1',
        is_specific_2: sectionType === 'specific2',
        is_specific_3: sectionType === 'specific3',
        section_type: sectionType // Novo campo para armazenar o tipo de seção
      };
    });

    // Deletar respostas existentes para evitar duplicatas
    const { error: deleteError } = await supabase
      .from('user_answers')
      .delete()
      .eq('user_ranking_id', rankingId);
      
    if (deleteError) throw deleteError;

    // Inserir novas respostas
    const { error: insertError } = await supabase
      .from('user_answers')
      .insert(answersData);
      
    if (insertError) throw insertError;

    return true;
  } catch (error) {
    console.error('Erro ao salvar respostas:', error);
    return false;
  }
};

// Função para obter as respostas do usuário
export const getUserAnswers = async (rankingId: string): Promise<Record<number, string>> => {
  try {
    const { data, error } = await supabase
      .from('user_answers')
      .select('question_number, answer')
      .eq('user_ranking_id', rankingId);
      
    if (error) throw error;

    const answers: Record<number, string> = {};
    data.forEach(item => {
      answers[item.question_number] = item.answer;
    });

    return answers;
  } catch (error) {
    console.error('Erro ao buscar respostas:', error);
    return {};
  }
};

// Função para atualizar o gabarito oficial
export const updateOfficialAnswer = async (
  concursoId: string, 
  questionNumber: number, 
  answer: string,
  weight: number = 1,
  isNullified: boolean = false
) => {
  try {
    // Obter o concurso para determinar o section_type
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
      
    if (concursoError) throw concursoError;
    
    // Determinar o tipo de seção desta questão
    const sectionType = getSectionTypeForQuestion(concurso, questionNumber);
    
    // Verificar se já existe uma resposta para esta questão
    const { data, error: checkError } = await supabase
      .from('official_answer_weights')
      .select('id')
      .eq('concurso_id', concursoId)
      .eq('question_number', questionNumber);
      
    if (checkError) throw checkError;
    
    let result;
    
    if (data && data.length > 0) {
      // Atualizar resposta existente
      result = await supabase
        .from('official_answer_weights')
        .update({ 
          correct_answer: answer,
          weight,
          is_nullified: isNullified,
          section_type: sectionType
        })
        .eq('concurso_id', concursoId)
        .eq('question_number', questionNumber);
    } else {
      // Inserir nova resposta
      result = await supabase
        .from('official_answer_weights')
        .insert({ 
          concurso_id: concursoId,
          question_number: questionNumber,
          correct_answer: answer,
          weight,
          is_nullified: isNullified,
          section_type: sectionType
        });
    }
    
    if (result.error) throw result.error;
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar gabarito:', error);
    return false;
  }
};

// Função para obter o gabarito oficial
export const getOfficialAnswers = async (concursoId: string): Promise<Record<number, { answer: string, weight: number, isNullified: boolean, sectionType: string }>> => {
  try {
    const { data, error } = await supabase
      .from('official_answer_weights')
      .select('question_number, correct_answer, weight, is_nullified, section_type')
      .eq('concurso_id', concursoId);
      
    if (error) throw error;

    const answers: Record<number, { answer: string, weight: number, isNullified: boolean, sectionType: string }> = {};
    data.forEach(item => {
      answers[item.question_number] = {
        answer: item.correct_answer,
        weight: item.weight || 1,
        isNullified: item.is_nullified || false,
        sectionType: item.section_type || 'basic'
      };
    });

    return answers;
  } catch (error) {
    console.error('Erro ao buscar gabarito oficial:', error);
    return {};
  }
};
