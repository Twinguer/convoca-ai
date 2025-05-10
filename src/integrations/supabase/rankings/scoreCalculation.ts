
import { supabase } from '../client';
import { Concurso } from '@/types/concursos';
import { SectionType } from './examStructure';

// Função para atualizar o tipo de seção para determinado concurso
export const updateSectionTypeForConcurso = async (
  concursoId: string,
  questionNumber: number,
  sectionType: SectionType
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('official_answer_weights')
      .update({ section_type: sectionType })
      .eq('concurso_id', concursoId)
      .eq('question_number', questionNumber);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating section type:', error);
    return false;
  }
};

// Função auxiliar para determinar o tipo de seção com base no número da questão
export const getSectionTypeForQuestion = (concurso: Concurso, questionNumber: number): SectionType => {
  let currentIndex = 1;
  
  // Conhecimentos Básicos
  if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
    if (questionNumber <= currentIndex + concurso.basic_knowledge_questions - 1) {
      return 'basic';
    }
    currentIndex += concurso.basic_knowledge_questions;
  }
  
  // Conhecimentos Específicos 1
  if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
    if (questionNumber <= currentIndex + concurso.specific_knowledge_1_questions - 1) {
      return 'specific1';
    }
    currentIndex += concurso.specific_knowledge_1_questions;
  }
  
  // Conhecimentos Específicos 2
  if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
    if (questionNumber <= currentIndex + concurso.specific_knowledge_2_questions - 1) {
      return 'specific2';
    }
    currentIndex += concurso.specific_knowledge_2_questions;
  }
  
  // Conhecimentos Específicos 3
  if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
    if (questionNumber <= currentIndex + concurso.specific_knowledge_3_questions - 1) {
      return 'specific3';
    }
    currentIndex += concurso.specific_knowledge_3_questions;
  }
  
  // Disciplinas customizadas
  if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
    for (const discipline of concurso.disciplines) {
      if (discipline.isEnabled && discipline.questionCount) {
        if (questionNumber <= currentIndex + discipline.questionCount - 1) {
          return discipline.type as SectionType;
        }
        currentIndex += discipline.questionCount;
      }
    }
  }
  
  // Fallback para conhecimentos específicos genéricos
  return 'specific1';
};

// Função para obter a estrutura de exame completa com tipos de seção mapeados
export const getExamStructure = (concurso: Concurso) => {
  const structure = {
    hasBasicKnowledge: concurso.has_basic_knowledge === true,
    hasSpecificKnowledge1: concurso.has_specific_knowledge_1 === true,
    hasSpecificKnowledge2: concurso.has_specific_knowledge_2 === true,
    hasSpecificKnowledge3: concurso.has_specific_knowledge_3 === true,
    hasDiscursive: concurso.has_discursive === true,
    hasCaseStudy1: concurso.has_case_study_1 === true,
    hasCaseStudy2: concurso.has_case_study_2 === true,
    hasCaseStudy3: concurso.has_case_study_3 === true,
    basicKnowledgeQuestions: concurso.basic_knowledge_questions || 0,
    specificKnowledge1Questions: concurso.specific_knowledge_1_questions || 0,
    specificKnowledge2Questions: concurso.specific_knowledge_2_questions || 0,
    specificKnowledge3Questions: concurso.specific_knowledge_3_questions || 0,
    basicKnowledgeWeight: concurso.basic_knowledge_weight || 1,
    // Usar specific_knowledge_weight como fallback para compatibilidade
    specificKnowledge1Weight: concurso.specific_knowledge_1_weight || concurso.specific_knowledge_weight || 1,
    specificKnowledge2Weight: concurso.specific_knowledge_2_weight || 1,
    specificKnowledge3Weight: concurso.specific_knowledge_3_weight || 1,
    discursiveWeight: concurso.discursive_weight || 1,
    caseStudy1Weight: concurso.case_study_1_weight || 1,
    caseStudy2Weight: concurso.case_study_2_weight || 1,
    caseStudy3Weight: concurso.case_study_3_weight || 1,
    disciplines: concurso.disciplines || []
  };
  
  return structure;
};
