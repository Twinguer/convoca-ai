
import { Concurso } from '@/types/concursos';
import type { SectionType } from '@/types/concursos';

// Mapeamento de nomes de exibição para seções
export const sectionDisplayNames: Record<string, string> = {
  'basic': 'Conhecimentos Básicos',
  'specific1': 'C. Específicos 1',
  'specific2': 'C. Específicos 2',
  'specific3': 'C. Específicos 3',
  'discursive': 'Discursiva',
  'case_study1': 'Estudo de Caso 1',
  'case_study2': 'Estudo de Caso 2',
  'case_study3': 'Estudo de Caso 3'
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

// Função para atualizar os nomes de exibição com disciplinas customizadas
export const updateSectionDisplayNames = (concurso: any): Record<string, string> => {
  // Criar uma cópia do objeto padrão
  const updatedNames = { ...sectionDisplayNames };
  
  // Se concurso tem disciplinas customizadas, adicionar seus nomes ao mapeamento
  if (concurso?.has_custom_knowledge && concurso?.disciplines && Array.isArray(concurso.disciplines)) {
    concurso.disciplines.forEach((discipline: any) => {
      if (discipline.type && discipline.name) {
        updatedNames[discipline.type] = discipline.name;
      }
    });
  }
  
  return updatedNames;
};

// Esta função é usada para obter o nome de exibição correto para uma disciplina/seção
export const getSectionDisplayName = (concurso: any, sectionType: string): string => {
  // Verificar se é uma das seções padrão
  if (sectionDisplayNames[sectionType]) {
    return sectionDisplayNames[sectionType];
  }
  
  // Verificar se é uma disciplina customizada
  if (concurso?.has_custom_knowledge && concurso?.disciplines) {
    const disciplines = getDisciplines(concurso);
    const discipline = disciplines.find((d: any) => d.type === sectionType);
    if (discipline) {
      return discipline.name;
    }
  }
  
  // Retornar o código da disciplina se não encontrar um nome melhor
  return sectionType;
};

// Lista de tipos de seção válidos para o banco de dados
export const validSectionTypes = ['basic', 'specific1', 'specific2', 'specific3', 'discursive', 'case_study1', 'case_study2', 'case_study3'];

// Função para sanitizar tipos de seção para garantir compatibilidade com o banco de dados
export const sanitizeSectionType = (sectionType: string): string => {
  // Para tipos padrão, retorna como está
  if (validSectionTypes.includes(sectionType)) {
    return sectionType;
  }
  
  // Para disciplinas customizadas, devemos retornar um tipo válido
  // O check constraint no banco de dados só aceita valores específicos
  return 'specific1'; // Usamos specific1 como fallback para garantir compatibilidade
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
          // É importante retornar um tipo válido para a constraint do banco de dados
          return sanitizeSectionType(discipline.type) as SectionType;
        }
        currentIndex += disciplineQuestions;
      }
    }
    
    console.warn(`Questão ${questionNumber} não encontrada em nenhuma disciplina customizada`);
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

// Helper function to get discipline data for a specific question
export const getDisciplineForQuestion = (concurso: Concurso, questionNumber: number): any => {
  if (!concurso.has_custom_knowledge) return null;
  
  const disciplines = getDisciplines(concurso);
  let currentIndex = 1;
  
  for (const discipline of disciplines) {
    if (discipline.isEnabled && discipline.questionCount) {
      const disciplineQuestions = getNumericValue(discipline.questionCount);
      if (disciplineQuestions > 0 && questionNumber >= currentIndex && questionNumber <= currentIndex + disciplineQuestions - 1) {
        return discipline;
      }
      currentIndex += disciplineQuestions;
    }
  }
  
  return null;
};

