
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
    customSections,
    totalQuestions: currentEnd
  };
};

// Define todos os tipos de seção possíveis no sistema
export type SectionType = 
  | 'basic' 
  | 'specific1' 
  | 'specific2' 
  | 'specific3' 
  | 'discursive' 
  | 'case_study1' 
  | 'case_study2' 
  | 'case_study3'
  | string; // Para tipos customizados digitados pelo usuário

// Mapeamento de seções para nomes de exibição
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
  }
  
  // Fallback para basic se não encontrar
  return 'basic';
};

/**
 * Obtém questões para uma seção específica
 * @param concurso Objeto do concurso
 * @param sectionType Tipo de seção
 * @returns Array com números das questões
 */
export const getQuestionsForSection = (concurso: Concurso, sectionType: SectionType): number[] => {
  const examStructure = getExamStructure(concurso);
  const questions: number[] = [];
  
  // Determinar o intervalo de questões com base na seção
  switch (sectionType) {
    case 'basic':
      if (concurso.has_basic_knowledge) {
        const start = 1;
        const end = examStructure.basicEnd;
        for (let i = start; i <= end; i++) {
          questions.push(i);
        }
      }
      break;
    case 'specific1':
      if (concurso.has_specific_knowledge_1) {
        const start = examStructure.basicEnd + 1;
        const end = examStructure.specific1End;
        for (let i = start; i <= end; i++) {
          questions.push(i);
        }
      }
      break;
    case 'specific2':
      if (concurso.has_specific_knowledge_2) {
        const start = examStructure.specific1End + 1;
        const end = examStructure.specific2End;
        for (let i = start; i <= end; i++) {
          questions.push(i);
        }
      }
      break;
    case 'specific3':
      if (concurso.has_specific_knowledge_3) {
        const start = examStructure.specific2End + 1;
        const end = examStructure.specific3End;
        for (let i = start; i <= end; i++) {
          questions.push(i);
        }
      }
      break;
    default:
      // Para seções customizadas
      if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
        const discipline = concurso.disciplines.find(d => d.type === sectionType && d.isEnabled);
        
        if (discipline) {
          // Encontrar o início desta disciplina customizada
          let startIndex = examStructure.specific3End;
          
          for (const d of concurso.disciplines) {
            if (d.type === sectionType) {
              break;
            }
            
            if (d.isEnabled && d.questionCount) {
              startIndex += d.questionCount;
            }
          }
          
          const start = startIndex + 1;
          const end = start + discipline.questionCount - 1;
          
          for (let i = start; i <= end; i++) {
            questions.push(i);
          }
        }
      }
      break;
  }
  
  return questions;
};
