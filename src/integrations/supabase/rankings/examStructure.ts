import { Concurso } from '@/types/concursos';

/**
 * Calcula a estrutura (faixas) do exame com base nas configurações do concurso
 */
export const getExamStructure = (concurso: any) => {
  // Calcula o fim de cada seção
  const basicEnd = concurso.basic_knowledge_questions || 0;
  const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
  const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);
  const specific3End = specific2End + (concurso.specific_knowledge_3_questions || 0);
  
  // Adiciona disciplinas customizadas ao cálculo
  let currentEnd = specific3End;
  let customSections: Record<string, number> = {};
  
  // Se temos conhecimento customizado genérico
  if (concurso.has_custom_knowledge && concurso.custom_knowledge_questions) {
    currentEnd += concurso.custom_knowledge_questions;
    customSections['custom'] = currentEnd;
  }
  
  // Adiciona disciplinas específicas se existirem
  if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
    concurso.disciplines.forEach((discipline: any) => {
      if (discipline.isEnabled && discipline.questionCount) {
        const sectionEnd = currentEnd + discipline.questionCount;
        customSections[discipline.type] = sectionEnd;
        currentEnd = sectionEnd;
      }
    });
  }
  
  return {
    basicEnd,
    specific1End,
    specific2End,
    specific3End,
    customEnd: currentEnd,
    customSections,
    totalQuestions: currentEnd
  };
};

// Define todos os tipos de seção possíveis no sistema
export type SectionType = string; // Changed to string to allow any section type

// Mapeamento de seções para nomes de exibição
export const sectionDisplayNames: Record<string, string> = {
  basic: 'Conhecimentos Básicos',
  specific1: 'Conhecimentos Específicos 1',
  specific2: 'Conhecimentos Específicos 2',
  specific3: 'Conhecimentos Específicos 3',
  custom: 'Conhecimentos Customizados',
  discursive: 'Discursiva',
  case_study1: 'Estudo de Caso 1',
  case_study2: 'Estudo de Caso 2',
  case_study3: 'Estudo de Caso 3'
};

/**
 * Atualiza o mapa de nomes de exibição com os conhecimentos customizados de um concurso
 */
export const updateSectionDisplayNames = (concurso: Concurso): Record<string, string> => {
  // Criar cópia do objeto para não modificar o original globalmente
  const updatedNames = { ...sectionDisplayNames };
  
  if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
    concurso.disciplines.forEach(discipline => {
      if (discipline.type && discipline.name) {
        updatedNames[discipline.type] = discipline.name;
      }
    });
  }
  
  return updatedNames;
};

/**
 * Retorna o tipo de seção para um número de questão específico
 */
export const getSectionTypeForQuestion = (concurso: Concurso, questionNumber: number): SectionType => {
  const examStructure = getExamStructure(concurso);
  
  if (questionNumber <= examStructure.basicEnd) {
    return 'basic';
  } else if (questionNumber <= examStructure.specific1End) {
    return 'specific1';
  } else if (questionNumber <= examStructure.specific2End) {
    return 'specific2';
  } else if (questionNumber <= examStructure.specific3End) {
    return 'specific3';
  }
  
  // Verificar seções customizadas
  if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
    let startNumber = examStructure.specific3End;
    
    for (const discipline of concurso.disciplines) {
      if (discipline.isEnabled && discipline.questionCount) {
        const endNumber = startNumber + discipline.questionCount;
        if (questionNumber > startNumber && questionNumber <= endNumber) {
          return discipline.type;
        }
        startNumber = endNumber;
      }
    }
  } else if (concurso.has_custom_knowledge && concurso.custom_knowledge_questions) {
    // Se não há disciplines detalhadas mas tem conhecimento customizado, usar tipo genérico
    if (questionNumber > examStructure.specific3End && 
        questionNumber <= examStructure.specific3End + concurso.custom_knowledge_questions) {
      return 'custom';
    }
  }
  
  // Fallback para basic se não encontrar
  return 'basic';
};
