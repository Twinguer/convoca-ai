
import { Concurso } from "@/types/concursos";

export interface Discipline {
  type: string;
  name: string;
  isEnabled: boolean;
  questionCount?: number;
  weight?: number;
}

// Mapeamento padrão de nomes para exibição das seções
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

// Nova função para verificar consistentemente se a estrutura é hierárquica
export const isHierarchicalStructure = (concurso: Concurso): boolean => {
  if (!concurso || !concurso.has_custom_knowledge || !concurso.disciplines || !Array.isArray(concurso.disciplines)) {
    return false;
  }

  return concurso.disciplines[0] && 
         typeof concurso.disciplines[0] === 'object' && 
         'name' in concurso.disciplines[0] && 
         'disciplines' in concurso.disciplines[0];
};

// Função para auxiliar a obter o nome de exibição de uma seção
export const getSectionDisplayName = (sectionType: string): string => {
  return sectionDisplayNames[sectionType] || sectionType;
};

// Função para obter a estrutura completa do exame
export const getExamStructure = (concurso: Concurso) => {
  if (!concurso) return { sections: [], totalQuestions: 0 };
  
  const result: {
    sections: Array<{
      type: string,
      name: string,
      questionCount: number,
      weight: number,
      isEnabled: boolean,
      blockName?: string
    }>,
    totalQuestions: number
  } = {
    sections: [],
    totalQuestions: 0
  };
  
  // Verificar se estamos usando conhecimentos customizados
  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    const hierarchical = isHierarchicalStructure(concurso);
    
    if (hierarchical) {
      // Processar estrutura hierárquica (blocos -> disciplinas)
      for (const block of concurso.disciplines as any[]) {
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled) {
              const questionCount = getNumericValue(discipline.questionCount);
              result.sections.push({
                type: discipline.type,
                name: `${block.name} - ${discipline.name}`,
                questionCount,
                weight: getNumericValue(discipline.weight) || 1,
                isEnabled: true,
                blockName: block.name
              });
              result.totalQuestions += questionCount;
            }
          }
        }
      }
    } else {
      // Processar estrutura plana
      for (const discipline of concurso.disciplines) {
        if (discipline.isEnabled) {
          const questionCount = getNumericValue(discipline.questionCount);
          result.sections.push({
            type: discipline.type,
            name: discipline.name,
            questionCount,
            weight: getNumericValue(discipline.weight) || 1,
            isEnabled: true
          });
          result.totalQuestions += questionCount;
        }
      }
    }
  } else {
    // Estrutura tradicional
    if (concurso.has_basic_knowledge) {
      result.sections.push({
        type: 'basic',
        name: sectionDisplayNames.basic,
        questionCount: getNumericValue(concurso.basic_knowledge_questions),
        weight: concurso.basic_knowledge_weight || 1,
        isEnabled: true
      });
      result.totalQuestions += getNumericValue(concurso.basic_knowledge_questions);
    }
    
    if (concurso.has_specific_knowledge_1) {
      result.sections.push({
        type: 'specific1',
        name: sectionDisplayNames.specific1,
        questionCount: getNumericValue(concurso.specific_knowledge_1_questions),
        weight: concurso.specific_knowledge_1_weight || 1,
        isEnabled: true
      });
      result.totalQuestions += getNumericValue(concurso.specific_knowledge_1_questions);
    }
    
    if (concurso.has_specific_knowledge_2) {
      result.sections.push({
        type: 'specific2',
        name: sectionDisplayNames.specific2,
        questionCount: getNumericValue(concurso.specific_knowledge_2_questions),
        weight: concurso.specific_knowledge_2_weight || 1,
        isEnabled: true
      });
      result.totalQuestions += getNumericValue(concurso.specific_knowledge_2_questions);
    }
    
    if (concurso.has_specific_knowledge_3) {
      result.sections.push({
        type: 'specific3',
        name: sectionDisplayNames.specific3,
        questionCount: getNumericValue(concurso.specific_knowledge_3_questions),
        weight: concurso.specific_knowledge_3_weight || 1,
        isEnabled: true
      });
      result.totalQuestions += getNumericValue(concurso.specific_knowledge_3_questions);
    }
  }
  
  return result;
};

// Função para obter todas as disciplinas de um concurso (incluindo seções tradicionais)
export const getDisciplines = (concurso: Concurso): Discipline[] => {
  const disciplines: Discipline[] = [];

  // Verificar se o concurso está usando a estrutura hierárquica
  if (concurso && concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    const hierarchical = isHierarchicalStructure(concurso);

    if (hierarchical) {
      // Processar estrutura hierárquica (blocos -> disciplinas)
      for (const block of concurso.disciplines as any[]) {
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            disciplines.push({
              type: discipline.type,
              name: `${block.name} - ${discipline.name}`,
              isEnabled: discipline.isEnabled === undefined ? true : !!discipline.isEnabled,
              questionCount: getNumericValue(discipline.questionCount),
              weight: getNumericValue(discipline.weight) || 1
            });
          }
        }
      }
    } else {
      // Processar estrutura plana
      for (const discipline of concurso.disciplines) {
        disciplines.push({
          type: discipline.type,
          name: discipline.name,
          isEnabled: discipline.isEnabled === undefined ? true : !!discipline.isEnabled,
          questionCount: getNumericValue(discipline.questionCount),
          weight: getNumericValue(discipline.weight) || 1
        });
      }
    }
  } else {
    // Seções tradicionais
    if (concurso?.has_basic_knowledge) {
      disciplines.push({
        type: 'basic',
        name: sectionDisplayNames.basic,
        isEnabled: true,
        questionCount: concurso.basic_knowledge_questions,
        weight: concurso.basic_knowledge_weight
      });
    }

    if (concurso?.has_specific_knowledge_1) {
      disciplines.push({
        type: 'specific1',
        name: sectionDisplayNames.specific1,
        isEnabled: true,
        questionCount: concurso.specific_knowledge_1_questions,
        weight: concurso.specific_knowledge_1_weight
      });
    }

    if (concurso?.has_specific_knowledge_2) {
      disciplines.push({
        type: 'specific2',
        name: sectionDisplayNames.specific2,
        isEnabled: true,
        questionCount: concurso.specific_knowledge_2_questions,
        weight: concurso.specific_knowledge_2_weight
      });
    }

    if (concurso?.has_specific_knowledge_3) {
      disciplines.push({
        type: 'specific3',
        name: sectionDisplayNames.specific3,
        isEnabled: true,
        questionCount: concurso.specific_knowledge_3_questions,
        weight: concurso.specific_knowledge_3_weight
      });
    }
  }

  return disciplines;
};

// Função para atualizar os nomes de exibição das seções
export const updateSectionDisplayNames = (concurso: Concurso): Record<string, string> => {
  const updatedNames = { ...sectionDisplayNames };
  
  // Verificar se estamos usando conhecimentos customizados
  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    const hierarchical = isHierarchicalStructure(concurso);
    
    if (hierarchical) {
      // Processar estrutura hierárquica
      for (const block of concurso.disciplines as any[]) {
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.type && discipline.name) {
              updatedNames[discipline.type] = `${block.name} - ${discipline.name}`;
            }
          }
        }
      }
    } else {
      // Processar disciplinas simples
      for (const discipline of concurso.disciplines) {
        if (discipline.type && discipline.name) {
          updatedNames[discipline.type] = discipline.name;
        }
      }
    }
  }
  
  return updatedNames;
};

// Função para obter o type de seção para uma questão específica
export const getSectionTypeForQuestion = (concurso: Concurso, questionNumber: number): string => {
  if (!concurso) return 'basic';
  
  // Verificar se estamos usando a estrutura hierárquica
  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    const hierarchical = isHierarchicalStructure(concurso);
    
    let currentPosition = 1;
    
    if (hierarchical) {
      // Processar estrutura hierárquica
      for (const block of concurso.disciplines as any[]) {
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled) {
              const questionCount = getNumericValue(discipline.questionCount);
              if (questionNumber >= currentPosition && questionNumber < currentPosition + questionCount) {
                return discipline.type;
              }
              currentPosition += questionCount;
            }
          }
        }
      }
    } else {
      // Processar estrutura plana
      for (const discipline of concurso.disciplines) {
        if (discipline.isEnabled) {
          const questionCount = getNumericValue(discipline.questionCount);
          if (questionNumber >= currentPosition && questionNumber < currentPosition + questionCount) {
            return discipline.type;
          }
          currentPosition += questionCount;
        }
      }
    }
  } else {
    // Estrutura tradicional
    let position = 1;
    
    if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
      const basicCount = getNumericValue(concurso.basic_knowledge_questions);
      if (questionNumber >= position && questionNumber < position + basicCount) {
        return 'basic';
      }
      position += basicCount;
    }
    
    if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
      const spec1Count = getNumericValue(concurso.specific_knowledge_1_questions);
      if (questionNumber >= position && questionNumber < position + spec1Count) {
        return 'specific1';
      }
      position += spec1Count;
    }
    
    if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
      const spec2Count = getNumericValue(concurso.specific_knowledge_2_questions);
      if (questionNumber >= position && questionNumber < position + spec2Count) {
        return 'specific2';
      }
      position += spec2Count;
    }
    
    if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
      const spec3Count = getNumericValue(concurso.specific_knowledge_3_questions);
      if (questionNumber >= position && questionNumber < position + spec3Count) {
        return 'specific3';
      }
    }
  }
  
  // Fallback para 'custom' se não encontrou correspondência
  return 'custom';
};

// Função para garantir compatibilidade do tipo de seção com o banco de dados
export const sanitizeSectionType = (sectionType: string): string => {
  const standardSections: Record<string, string> = {
    'basic': 'basic',
    'specific1': 'specific1',
    'specific2': 'specific2', 
    'specific3': 'specific3',
    'discursive': 'discursive',
    'case_study1': 'case_study1',
    'case_study2': 'case_study2',
    'case_study3': 'case_study3'
  };
  
  return standardSections[sectionType] || sectionType;
};

// Função para converter valores para número, garantindo que não seja NaN
export const getNumericValue = (value: any): number => {
  if (value === undefined || value === null) return 0;
  
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? 0 : num;
};
