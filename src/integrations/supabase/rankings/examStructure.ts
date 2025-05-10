
import { Concurso } from '@/types/concursos';
import type { SectionType } from '@/types/concursos';

// Objeto de nomes de exibição das seções
export const sectionDisplayNames: Record<string, string> = {
  basic: 'Conhecimentos Básicos',
  specific1: 'Conhecimentos Específicos 1',
  specific2: 'Conhecimentos Específicos 2',
  specific3: 'Conhecimentos Específicos 3',
  discursive: 'Discursiva',
  case_study1: 'Estudo de Caso 1',
  case_study2: 'Estudo de Caso 2',
  case_study3: 'Estudo de Caso 3'
};

// Helper function to safely get numeric value from possibly JSONB field
export const getNumericValue = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Helper function to safely handle the disciplines array
export const getDisciplines = (concurso: Concurso) => {
  // Se disciplines está definido no concurso, retorne-o, caso contrário, retorne um array vazio
  if (!concurso.disciplines) {
    return [];
  }
  
  // Se for uma string JSON, tente fazer o parse
  if (typeof concurso.disciplines === 'string') {
    try {
      return JSON.parse(concurso.disciplines);
    } catch (e) {
      console.error('Error parsing disciplines JSON:', e);
      return [];
    }
  }
  
  // Se já for um array, retorne-o
  if (Array.isArray(concurso.disciplines)) {
    return concurso.disciplines;
  }
  
  // Se for um objeto, verifique se é um objeto JSONB do Postgres
  return concurso.disciplines || [];
};

// Função para obter a estrutura de exame de um concurso
export const getExamStructure = (concurso: Concurso) => {
  // Verificar se estamos usando knowledge areas customizáveis
  const useCustomKnowledge = concurso.has_custom_knowledge === true;
  
  // Estrutura básica que será retornada
  const examStructure = {
    // Estrutura tradicional
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
    basicKnowledgeWeight: getNumericValue(concurso.basic_knowledge_weight),
    specificKnowledge1Weight: getNumericValue(concurso.specific_knowledge_1_weight),
    specificKnowledge2Weight: getNumericValue(concurso.specific_knowledge_2_weight),
    specificKnowledge3Weight: getNumericValue(concurso.specific_knowledge_3_weight),
    discursiveWeight: getNumericValue(concurso.discursive_weight),
    caseStudy1Weight: getNumericValue(concurso.case_study_1_weight),
    caseStudy2Weight: getNumericValue(concurso.case_study_2_weight),
    caseStudy3Weight: getNumericValue(concurso.case_study_3_weight),
    
    // Nova estrutura customizável
    useCustomKnowledge: useCustomKnowledge,
    customKnowledgeQuestions: getNumericValue(concurso.custom_knowledge_questions),
    customKnowledgeWeight: getNumericValue(concurso.custom_knowledge_weight),
    disciplines: getDisciplines(concurso)
  };
  
  return examStructure;
};

// Função para atualizar os nomes de exibição das seções
export const updateSectionDisplayNames = (concurso: Concurso) => {
  const disciplines = getDisciplines(concurso);
  const displayNames = { ...sectionDisplayNames };
  
  // Adicionar nomes customizados das disciplinas
  disciplines.forEach(discipline => {
    if (discipline.type && discipline.name) {
      displayNames[discipline.type] = discipline.name;
    }
  });
  
  return displayNames;
};

// Função auxiliar para determinar o tipo de seção com base no número da questão
export const getSectionTypeForQuestion = (concurso: Concurso, questionNumber: number): SectionType => {
  // Verificar se estamos usando a estrutura customizável
  if (concurso.has_custom_knowledge === true) {
    const disciplines = getDisciplines(concurso);
    let currentIndex = 1;
    
    for (const discipline of disciplines) {
      if (discipline.isEnabled && discipline.questionCount) {
        const disciplineQuestions = getNumericValue(discipline.questionCount);
        if (disciplineQuestions > 0 && questionNumber >= currentIndex && questionNumber <= currentIndex + disciplineQuestions - 1) {
          return discipline.type as SectionType;
        }
        currentIndex += disciplineQuestions;
      }
    }
    
    // Fallback para conhecimentos específicos genéricos se não encontrar
    return 'specific1';
  }
  
  // Estrutura tradicional
  let currentIndex = 1;
  
  // Conhecimentos Básicos
  if (concurso.has_basic_knowledge) {
    const basicQuestions = getNumericValue(concurso.basic_knowledge_questions);
    if (basicQuestions > 0 && questionNumber >= currentIndex && questionNumber <= currentIndex + basicQuestions - 1) {
      return 'basic';
    }
    currentIndex += basicQuestions;
  }
  
  // Conhecimentos Específicos 1
  if (concurso.has_specific_knowledge_1) {
    const specificQuestions1 = getNumericValue(concurso.specific_knowledge_1_questions);
    if (specificQuestions1 > 0 && questionNumber >= currentIndex && questionNumber <= currentIndex + specificQuestions1 - 1) {
      return 'specific1';
    }
    currentIndex += specificQuestions1;
  }
  
  // Conhecimentos Específicos 2
  if (concurso.has_specific_knowledge_2) {
    const specificQuestions2 = getNumericValue(concurso.specific_knowledge_2_questions);
    if (specificQuestions2 > 0 && questionNumber >= currentIndex && questionNumber <= currentIndex + specificQuestions2 - 1) {
      return 'specific2';
    }
    currentIndex += specificQuestions2;
  }
  
  // Conhecimentos Específicos 3
  if (concurso.has_specific_knowledge_3) {
    const specificQuestions3 = getNumericValue(concurso.specific_knowledge_3_questions);
    if (specificQuestions3 > 0 && questionNumber >= currentIndex && questionNumber <= currentIndex + specificQuestions3 - 1) {
      return 'specific3';
    }
  }
  
  // Fallback para conhecimentos específicos genéricos
  return 'specific1';
};
