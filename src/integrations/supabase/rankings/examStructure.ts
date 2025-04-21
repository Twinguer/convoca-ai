
import { supabase } from '../client';

/**
 * Carrega a estrutura do exame do concurso
 */
export const loadExamStructure = async (concursoId: string) => {
  try {
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
    
    return getExamStructure(concurso);
  } catch (error) {
    console.error('Error loading exam structure:', error);
    throw error;
  }
};

/**
 * Calcula as faixas de questões para cada seção
 */
export const getExamStructure = (concurso: any) => {
  const basicQuestionsCount = concurso.basic_knowledge_questions || 0;
  const specific1QuestionsCount = concurso.specific_knowledge_1_questions || 0;
  const specific2QuestionsCount = concurso.specific_knowledge_2_questions || 0;
  const specific3QuestionsCount = concurso.specific_knowledge_3_questions || 0;

  // Faixas das seções para determinar em qual conhecimento a questão pertence
  const basicEnd = basicQuestionsCount;
  const specific1End = basicEnd + specific1QuestionsCount;
  const specific2End = specific1End + specific2QuestionsCount;
  const specific3End = specific2End + specific3QuestionsCount;

  return {
    basicQuestionsCount,
    specific1QuestionsCount,
    specific2QuestionsCount,
    specific3QuestionsCount,
    basicEnd,
    specific1End,
    specific2End,
    specific3End,
    totalQuestions: basicEnd + specific1QuestionsCount + specific2QuestionsCount + specific3QuestionsCount
  };
};

/**
 * Determina a seção a que uma questão pertence
 */
export const getQuestionSection = (questionNumber: number, structure: ReturnType<typeof getExamStructure>) => {
  if (questionNumber <= structure.basicEnd) {
    return 'basic';
  } else if (questionNumber <= structure.specific1End) {
    return 'specific1';
  } else if (questionNumber <= structure.specific2End) {
    return 'specific2';
  } else {
    return 'specific3';
  }
};
