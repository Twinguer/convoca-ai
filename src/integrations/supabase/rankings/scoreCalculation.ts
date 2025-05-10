
import { supabase } from '../client';
import { SectionType, getSectionTypeForQuestion } from './examStructure';
import { Concurso } from '@/types/concursos';

/**
 * Atualiza o tipo de seção para todas as questões de um concurso
 */
export const updateSectionTypeForConcurso = async (concursoId: string) => {
  try {
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
      
    if (concursoError) throw concursoError;

    // Obter a estrutura do exame
    const examStructure = getExamStructure(concurso);
    
    // Atualizar cada questão com seu respectivo tipo de seção
    const { error } = await supabase.rpc('update_question_section_types', { 
      p_concurso_id: concursoId,
      p_basic_end: examStructure.basicEnd,
      p_specific1_end: examStructure.specific1End,
      p_specific2_end: examStructure.specific2End,
      p_specific3_end: examStructure.specific3End
    });

    if (error) {
      console.error('Erro ao atualizar tipos de seção:', error);
      return { success: false, error: error.message };
    }

    // Atualizar tipos de seção para disciplinas customizadas
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      let currentEnd = examStructure.specific3End;

      for (const discipline of concurso.disciplines) {
        if (discipline.isEnabled && discipline.questionCount) {
          const startIndex = currentEnd + 1;
          const endIndex = currentEnd + discipline.questionCount;

          // Atualizar section_type para esta disciplina
          for (let questionNumber = startIndex; questionNumber <= endIndex; questionNumber++) {
            const { error: updateError } = await supabase
              .from('official_answer_weights')
              .update({ section_type: discipline.type })
              .match({ 
                concurso_id: concursoId,
                question_number: questionNumber 
              });

            if (updateError) {
              console.error(`Erro ao atualizar tipo de seção para questão ${questionNumber}:`, updateError);
            }
          }

          currentEnd = endIndex;
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar tipos de seção:', error);
    return { success: false, error: String(error) };
  }
};

// Helper function to determine exam structure
const getExamStructure = (concurso: any) => {
  // Calcula o fim de cada seção
  const basicEnd = concurso.basic_knowledge_questions || 0;
  const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
  const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);
  const specific3End = specific2End + (concurso.specific_knowledge_3_questions || 0);
  
  // Calcular questões de disciplinas customizadas
  let totalQuestions = specific3End;
  if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
    for (const discipline of concurso.disciplines) {
      if (discipline.isEnabled && discipline.questionCount) {
        totalQuestions += discipline.questionCount;
      }
    }
  }
  
  return {
    basicEnd,
    specific1End,
    specific2End,
    specific3End,
    totalQuestions
  };
};

/**
 * Calcula pontuação para um usuário com base nas respostas e no gabarito
 */
export const calculateUserScore = async (rankingId: string, concursoId: string) => {
  try {
    // Buscar dados do concurso
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
      
    if (concursoError) throw concursoError;

    // Buscar respostas do usuário
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', rankingId);
      
    if (answersError) throw answersError;

    // Buscar gabarito oficial
    const { data: officialAnswers, error: officialError } = await supabase
      .from('official_answer_weights')
      .select('*')
      .eq('concurso_id', concursoId);
      
    if (officialError) throw officialError;

    // Calcular pontuações por seção
    const scores = {
      basic: 0,
      specific1: 0,
      specific2: 0,
      specific3: 0
    };
    
    // Pontuações para disciplinas customizadas
    const customScores: Record<string, number> = {};
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      concurso.disciplines.forEach(discipline => {
        if (discipline.isEnabled && discipline.type) {
          customScores[discipline.type] = 0;
        }
      });
    }
    
    // Verificar cada resposta
    userAnswers.forEach(userAnswer => {
      const officialAnswer = officialAnswers.find(oa => 
        oa.question_number === userAnswer.question_number
      );
      
      if (officialAnswer) {
        const isCorrect = 
          officialAnswer.is_nullified || 
          officialAnswer.correct_answer.toUpperCase() === userAnswer.answer.toUpperCase();
        
        const sectionType = officialAnswer.section_type || 
                            getSectionTypeForQuestion(concurso, userAnswer.question_number);
        
        if (isCorrect) {
          // Atribuir pontos à seção correta
          switch (sectionType) {
            case 'basic':
              scores.basic += officialAnswer.weight;
              break;
            case 'specific1':
              scores.specific1 += officialAnswer.weight;
              break;
            case 'specific2':
              scores.specific2 += officialAnswer.weight;
              break;
            case 'specific3':
              scores.specific3 += officialAnswer.weight;
              break;
            default:
              // Para seções customizadas
              if (customScores.hasOwnProperty(sectionType)) {
                customScores[sectionType] += officialAnswer.weight;
              }
              break;
          }
        }
      }
    });

    // Calcular pontuação com peso
    let totalScore = 
      scores.basic * (concurso.basic_knowledge_weight || 1) +
      scores.specific1 * (concurso.specific_knowledge_1_weight || 1) +
      scores.specific2 * (concurso.specific_knowledge_2_weight || 1) +
      scores.specific3 * (concurso.specific_knowledge_3_weight || 1);
    
    // Adicionar pontuações de disciplinas customizadas
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      concurso.disciplines.forEach(discipline => {
        if (discipline.isEnabled && discipline.type && customScores[discipline.type] !== undefined) {
          totalScore += customScores[discipline.type] * (discipline.weight || 1);
        }
      });
    }

    // Atualizar pontuação no ranking
    const { error: updateError } = await supabase
      .from('user_rankings')
      .update({
        basic_knowledge_score: scores.basic,
        specific_knowledge_1_score: scores.specific1,
        specific_knowledge_2_score: scores.specific2,
        specific_knowledge_3_score: scores.specific3,
        score: totalScore,
        // Armazenar pontuações de disciplinas customizadas
        custom_discipline_scores: customScores
      })
      .eq('id', rankingId);
      
    if (updateError) throw updateError;

    return { 
      success: true, 
      score: totalScore, 
      sectionScores: { 
        basic: scores.basic, 
        specific1: scores.specific1, 
        specific2: scores.specific2, 
        specific3: scores.specific3 
      },
      customScores 
    };
  } catch (error) {
    console.error('Erro ao calcular pontuação:', error);
    return { success: false, error: String(error) };
  }
};
