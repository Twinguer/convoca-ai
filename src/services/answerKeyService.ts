
import { supabase } from '@/integrations/supabase/client';
import { getExamStructure, getSubjectExamStructure } from '@/integrations/supabase/rankings/examStructure';
import { calculateOfficialAnswersForSubjectBased } from '@/integrations/supabase/rankings/scoreCalculation';

interface Answer {
  id?: string;
  question_number: number;
  correct_answer: string;
  weight?: number;
  section_type?: string;
  is_nullified?: boolean;
}

/**
 * Busca o gabarito oficial de um concurso
 * @param concursoId ID do concurso
 * @returns Um objeto com as respostas oficiais
 */
export const fetchOfficialAnswerWeights = async (concursoId: string) => {
  try {
    // Buscar o concurso primeiro para determinar seu tipo
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
    
    if (concursoError) throw concursoError;
    
    // Verificar se o concurso é baseado em disciplinas e se precisa de setup
    if (concurso.minimum_score_type === 'subject') {
      // Garantir que a estrutura do gabarito para disciplinas exista
      await calculateOfficialAnswersForSubjectBased(concursoId);
    }
    
    // Buscar o gabarito oficial
    const { data, error } = await supabase
      .from('official_answer_weights')
      .select('*')
      .eq('concurso_id', concursoId)
      .order('question_number', { ascending: true });
    
    if (error) throw error;
    
    // Formatar o resultado
    const result: Record<string, any> = {};
    
    if (data) {
      data.forEach(answer => {
        result[`questao${answer.question_number}`] = {
          resposta: answer.correct_answer,
          peso: answer.weight,
          secao: answer.section_type,
          anulada: answer.is_nullified
        };
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching official answer weights:', error);
    throw error;
  }
};

/**
 * Atualiza uma resposta no gabarito oficial
 * @param concursoId ID do concurso
 * @param questionNumber Número da questão
 * @param answer Resposta correta
 * @param isNullified Se a questão está anulada
 * @returns Status da operação
 */
export const updateAnswer = async (
  concursoId: string,
  questionNumber: number,
  answer: string,
  isNullified: boolean = false
) => {
  try {
    // Buscar o concurso para determinar o tipo de estrutura
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
    
    if (concursoError) throw concursoError;
    
    let sectionType = '';
    
    if (concurso.minimum_score_type === 'subject') {
      // Determinar a disciplina com base no número da questão
      const { subjectRanges } = getSubjectExamStructure(concurso);
      
      for (const [code, range] of Object.entries(subjectRanges)) {
        if (questionNumber >= range.start && questionNumber <= range.end) {
          sectionType = code;
          break;
        }
      }
    } else {
      // Usar a estrutura padrão por conhecimentos
      const { basicEnd, specific1End, specific2End } = getExamStructure(concurso);
      
      if (questionNumber <= basicEnd) {
        sectionType = 'basic';
      } else if (questionNumber <= specific1End) {
        sectionType = 'specific1';
      } else if (questionNumber <= specific2End) {
        sectionType = 'specific2';
      } else {
        sectionType = 'specific3';
      }
    }
    
    // Buscar se já existe uma resposta para esta questão
    const { data: existingAnswers } = await supabase
      .from('official_answer_weights')
      .select('id')
      .eq('concurso_id', concursoId)
      .eq('question_number', questionNumber);
    
    if (existingAnswers && existingAnswers.length > 0) {
      // Atualizar resposta existente
      const { error } = await supabase
        .from('official_answer_weights')
        .update({
          correct_answer: answer,
          is_nullified: isNullified,
          section_type: sectionType
        })
        .eq('id', existingAnswers[0].id);
      
      if (error) throw error;
    } else {
      // Criar nova resposta
      const { error } = await supabase
        .from('official_answer_weights')
        .insert({
          concurso_id: concursoId,
          question_number: questionNumber,
          correct_answer: answer,
          weight: 1,
          is_nullified: isNullified,
          section_type: sectionType,
          question_type: concurso.exam_type === 'Certo-Errado' ? 'TRUE_FALSE' : 'MULTIPLE_CHOICE'
        });
      
      if (error) throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating answer:', error);
    return { success: false, error };
  }
};

/**
 * Salva todo o gabarito de uma vez e recalcula as pontuações
 * @param concursoId ID do concurso
 * @param answers Objeto com as respostas (formato: {questao1: {resposta: 'A'}, ...})
 * @param recalculateScores Se deve recalcular as pontuações dos usuários
 * @returns Status da operação
 */
export const saveAnswerKeyAndRecalculate = async (
  concursoId: string,
  answers: Record<string, { resposta: string; anulada?: boolean }>,
  recalculateScores: boolean = true
) => {
  try {
    // Buscar o concurso para determinar o tipo de estrutura
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
    
    if (concursoError) throw concursoError;
    
    // Determinar a estrutura baseada no tipo de concurso
    let questionSectionMap: Record<number, string> = {};
    
    if (concurso.minimum_score_type === 'subject') {
      // Usar a estrutura por disciplinas
      const { subjectRanges } = getSubjectExamStructure(concurso);
      
      for (const [code, range] of Object.entries(subjectRanges)) {
        for (let i = range.start; i <= range.end; i++) {
          questionSectionMap[i] = code;
        }
      }
    } else {
      // Usar a estrutura padrão por conhecimentos
      const { basicEnd, specific1End, specific2End } = getExamStructure(concurso);
      
      for (let i = 1; i <= basicEnd; i++) {
        questionSectionMap[i] = 'basic';
      }
      
      for (let i = basicEnd + 1; i <= specific1End; i++) {
        questionSectionMap[i] = 'specific1';
      }
      
      for (let i = specific1End + 1; i <= specific2End; i++) {
        questionSectionMap[i] = 'specific2';
      }
      
      for (let i = specific2End + 1; i <= concurso.specific_knowledge_3_questions + specific2End; i++) {
        questionSectionMap[i] = 'specific3';
      }
    }
    
    // Preparar os registros para upsert
    const answersToUpsert = Object.entries(answers).map(([key, value]) => {
      const questionNumber = parseInt(key.replace('questao', ''));
      return {
        concurso_id: concursoId,
        question_number: questionNumber,
        correct_answer: value.resposta,
        weight: 1, // Peso padrão
        is_nullified: !!value.anulada,
        section_type: questionSectionMap[questionNumber] || 'unknown',
        question_type: concurso.exam_type === 'Certo-Errado' ? 'TRUE_FALSE' : 'MULTIPLE_CHOICE'
      };
    });
    
    // Remover existentes e inserir novos
    const { data: existingAnswers } = await supabase
      .from('official_answer_weights')
      .select('id, question_number')
      .eq('concurso_id', concursoId);
    
    // Criar mapa de respostas existentes
    const existingMap = new Map();
    if (existingAnswers) {
      existingAnswers.forEach(answer => {
        existingMap.set(answer.question_number, answer.id);
      });
    }
    
    // Separar em inserções e atualizações
    const toUpdate = [];
    const toInsert = [];
    
    answersToUpsert.forEach(answer => {
      if (existingMap.has(answer.question_number)) {
        toUpdate.push({
          ...answer,
          id: existingMap.get(answer.question_number)
        });
      } else {
        toInsert.push(answer);
      }
    });
    
    // Executar as operações
    if (toUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from('official_answer_weights')
        .upsert(toUpdate);
      
      if (updateError) throw updateError;
    }
    
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('official_answer_weights')
        .insert(toInsert);
      
      if (insertError) throw insertError;
    }
    
    // Recalcular pontuações se necessário
    if (recalculateScores) {
      await supabase.rpc('recalculate_all_scores', { p_concurso_id: concursoId });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving answer key:', error);
    return { success: false, error };
  }
};
