
import { Concurso, SectionType } from '@/types/concursos';

// Objeto de nomes de exibição das seções (adicionado aqui para resolver o erro de importação)
export const sectionDisplayNames: Record<string, string> = {
  basic: 'Conhecimentos Básicos',
  specific1: 'Conhecimentos Específicos 1',
  specific2: 'Conhecimentos Específicos 2',
  specific3: 'Conhecimentos Específicos 3',
  discursive: 'Discursiva',
  case_study1: 'Estudo de Caso 1',
  case_study2: 'Estudo de Caso 2',
  case_study3: 'Estudo de Caso 3',
  custom: 'Conhecimentos Customizados'
};

// Helper function to safely get numeric value from possibly JSONB field
const getNumericValue = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'object') {
    // If it's a JSONB object, try to extract a numeric value
    try {
      // This is just a placeholder. Adjust based on actual structure if needed
      return 0;
    } catch (e) {
      console.warn('Failed to parse JSONB value:', e);
      return 0;
    }
  }
  return 0;
};

// Função para obter a estrutura de exame de um concurso
export const getExamStructure = (concurso: Concurso) => {
  return {
    hasBasicKnowledge: concurso.has_basic_knowledge === true,
    hasSpecificKnowledge1: concurso.has_specific_knowledge_1 === true,
    hasSpecificKnowledge2: concurso.has_specific_knowledge_2 === true,
    hasSpecificKnowledge3: concurso.has_specific_knowledge_3 === true,
    hasDiscursive: concurso.has_discursive === true,
    hasCaseStudy1: concurso.has_case_study_1 === true,
    hasCaseStudy2: concurso.has_case_study_2 === true,
    hasCaseStudy3: concurso.has_case_study_3 === true,
    basicKnowledgeQuestions: getNumericValue(concurso.basic_knowledge_questions),
    specificKnowledge1Questions: getNumericValue(concurso.specific_knowledge_1_questions),
    specificKnowledge2Questions: getNumericValue(concurso.specific_knowledge_2_questions),
    specificKnowledge3Questions: getNumericValue(concurso.specific_knowledge_3_questions),
    basicKnowledgeWeight: concurso.basic_knowledge_weight || 1,
    specificKnowledge1Weight: concurso.specific_knowledge_1_weight || 1,
    specificKnowledge2Weight: concurso.specific_knowledge_2_weight || 1,
    specificKnowledge3Weight: concurso.specific_knowledge_3_weight || 1,
    discursiveWeight: concurso.discursive_weight || 1,
    caseStudy1Weight: concurso.case_study_1_weight || 1,
    caseStudy2Weight: concurso.case_study_2_weight || 1,
    caseStudy3Weight: concurso.case_study_3_weight || 1
  };
};

// Função para atualizar os nomes de exibição das seções, incluindo disciplinas customizadas
export const updateSectionDisplayNames = (concurso: Concurso) => {
  const sectionDisplayNames: Record<string, string> = {
    basic: 'Conhecimentos Básicos',
    specific1: 'Conhecimentos Específicos 1',
    specific2: 'Conhecimentos Específicos 2',
    specific3: 'Conhecimentos Específicos 3',
    discursive: 'Discursiva',
    case_study1: 'Estudo de Caso 1',
    case_study2: 'Estudo de Caso 2',
    case_study3: 'Estudo de Caso 3',
    custom: 'Conhecimentos Customizados'
  };
  
  // Adicionar disciplinas customizadas
  if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
    concurso.disciplines.forEach(discipline => {
      if (discipline.isEnabled && discipline.type && discipline.name) {
        sectionDisplayNames[discipline.type] = discipline.name;
      }
    });
  }
  
  return sectionDisplayNames;
};

// Função auxiliar para determinar o tipo de seção com base no número da questão
export const getSectionTypeForQuestion = (concurso: Concurso, questionNumber: number): SectionType => {
  let currentIndex = 1;
  
  // Conhecimentos Básicos
  if (concurso.has_basic_knowledge) {
    const basicQuestions = getNumericValue(concurso.basic_knowledge_questions);
    if (basicQuestions > 0 && questionNumber <= currentIndex + basicQuestions - 1) {
      return 'basic';
    }
    currentIndex += basicQuestions;
  }
  
  // Conhecimentos Específicos 1
  if (concurso.has_specific_knowledge_1) {
    const specificQuestions1 = getNumericValue(concurso.specific_knowledge_1_questions);
    if (specificQuestions1 > 0 && questionNumber <= currentIndex + specificQuestions1 - 1) {
      return 'specific1';
    }
    currentIndex += specificQuestions1;
  }
  
  // Conhecimentos Específicos 2
  if (concurso.has_specific_knowledge_2) {
    const specificQuestions2 = getNumericValue(concurso.specific_knowledge_2_questions);
    if (specificQuestions2 > 0 && questionNumber <= currentIndex + specificQuestions2 - 1) {
      return 'specific2';
    }
    currentIndex += specificQuestions2;
  }
  
  // Conhecimentos Específicos 3
  if (concurso.has_specific_knowledge_3) {
    const specificQuestions3 = getNumericValue(concurso.specific_knowledge_3_questions);
    if (specificQuestions3 > 0 && questionNumber <= currentIndex + specificQuestions3 - 1) {
      return 'specific3';
    }
    currentIndex += specificQuestions3;
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
