import { Concurso, DisciplineBlock, NestedDiscipline } from '@/types/concursos';

// Mapa para exibição amigável dos nomes das seções
export let sectionDisplayNames: Record<string, string> = {
  'basic': 'Conhecimentos Básicos',
  'specific1': 'C. Específicos 1',
  'specific2': 'C. Específicos 2',
  'specific3': 'C. Específicos 3',
  'discursive': 'Discursiva',
  'case_study1': 'Estudo de Caso 1',
  'case_study2': 'Estudo de Caso 2',
  'case_study3': 'Estudo de Caso 3'
};

// Helper function to get display name for a section
export const getSectionDisplayName = (sectionType: string): string => {
  return sectionDisplayNames[sectionType] || sectionType;
};

// Função para garantir tipo de seção válido
export const sanitizeSectionType = (sectionType: string | undefined): string => {
  if (!sectionType) return 'basic';
  
  if (
    sectionType === 'basic' || 
    sectionType === 'specific1' || 
    sectionType === 'specific2' || 
    sectionType === 'specific3' ||
    sectionType === 'discursive' ||
    sectionType === 'case_study1' ||
    sectionType === 'case_study2' ||
    sectionType === 'case_study3'
  ) {
    return sectionType;
  }
  
  // Tipos customizados são permitidos (começam com custom_)
  if (sectionType.startsWith('custom_')) {
    return sectionType;
  }
  
  // Fallback para basic por padrão
  return 'basic';
};

// Wrapper function to safely convert string/number/any to numeric value
export const getNumericValue = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Determinar o tipo de seção para uma questão específica
export const getSectionTypeForQuestion = (concurso: Concurso, questionNumber: number): string => {
  if (!concurso) return 'basic';

  // Se estamos usando conhecimentos customizáveis
  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    // Verificar se temos estrutura hierárquica
    const hierarchical = isHierarchicalStructure(concurso);
    let currentIndex = 1;

    if (hierarchical) {
      // Processar estrutura hierárquica (blocos -> disciplinas)
      for (const block of concurso.disciplines as any[]) {
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled) {
              const questionCount = getNumericValue(discipline.questionCount);
              
              // Se a questão está nesta disciplina
              if (questionNumber >= currentIndex && questionNumber < currentIndex + questionCount) {
                return discipline.type;
              }
              
              currentIndex += questionCount;
            }
          }
        }
      }
    } else {
      // Processar estrutura plana
      for (const discipline of concurso.disciplines) {
        if (discipline.isEnabled) {
          const questionCount = getNumericValue(discipline.questionCount);
          
          // Se a questão está nesta disciplina
          if (questionNumber >= currentIndex && questionNumber < currentIndex + questionCount) {
            return discipline.type;
          }
          
          currentIndex += questionCount;
        }
      }
    }
  }

  // Estrutura tradicional
  let index = 1;
  
  // Conhecimentos Básicos
  if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
    const basicCount = getNumericValue(concurso.basic_knowledge_questions);
    if (questionNumber >= index && questionNumber < index + basicCount) {
      return 'basic';
    }
    index += basicCount;
  }
  
  // Conhecimentos Específicos 1
  if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
    const specificCount = getNumericValue(concurso.specific_knowledge_1_questions);
    if (questionNumber >= index && questionNumber < index + specificCount) {
      return 'specific1';
    }
    index += specificCount;
  }
  
  // Conhecimentos Específicos 2
  if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
    const specificCount = getNumericValue(concurso.specific_knowledge_2_questions);
    if (questionNumber >= index && questionNumber < index + specificCount) {
      return 'specific2';
    }
    index += specificCount;
  }
  
  // Conhecimentos Específicos 3
  if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
    const specificCount = getNumericValue(concurso.specific_knowledge_3_questions);
    if (questionNumber >= index && questionNumber < index + specificCount) {
      return 'specific3';
    }
  }
  
  // Fallback
  return 'basic';
};

// Consistent function to check if the structure is hierarchical
export const isHierarchicalStructure = (concurso: Concurso): boolean => {
  if (!concurso?.disciplines || !Array.isArray(concurso.disciplines) || concurso.disciplines.length === 0) {
    return false;
  }
  
  // Check if at least one element in the disciplines array has the expected structure
  const firstDiscipline = concurso.disciplines[0];
  const isHierarchical = 
    typeof firstDiscipline === 'object' && 
    firstDiscipline !== null &&
    'disciplines' in firstDiscipline;
    
  console.log(`[isHierarchicalStructure] Analyzed concurso ${concurso.id}, structure is ${isHierarchical ? 'hierarchical' : 'flat'}`);
  
  return isHierarchical;
};

// Get disciplines from both hierarchical and flat structures
export const getDisciplines = (concurso: Concurso) => {
  if (!concurso) return [];
  
  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    const hierarchical = isHierarchicalStructure(concurso);
    
    if (hierarchical) {
      // Flatten the hierarchical structure to get all disciplines
      const disciplines: NestedDiscipline[] = [];
      
      for (const block of concurso.disciplines as DisciplineBlock[]) {
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            // Add block information to the discipline
            disciplines.push({
              ...discipline,
              blockName: block.name,
              blockId: block.id,
              blockWeight: block.weight
            } as any);
          }
        }
      }
      
      return disciplines;
    } else {
      // Return flat structure directly
      return concurso.disciplines as NestedDiscipline[];
    }
  }
  
  // For traditional structure, create discipline objects
  const disciplines: any[] = [];
  
  if (concurso.has_basic_knowledge) {
    disciplines.push({
      name: 'Conhecimentos Básicos',
      type: 'basic',
      isEnabled: true,
      questionCount: concurso.basic_knowledge_questions || 0,
      weight: concurso.basic_knowledge_weight || 1
    });
  }
  
  if (concurso.has_specific_knowledge_1) {
    disciplines.push({
      name: 'Conhecimentos Específicos 1',
      type: 'specific1',
      isEnabled: true,
      questionCount: concurso.specific_knowledge_1_questions || 0,
      weight: concurso.specific_knowledge_1_weight || 1
    });
  }
  
  if (concurso.has_specific_knowledge_2) {
    disciplines.push({
      name: 'Conhecimentos Específicos 2',
      type: 'specific2',
      isEnabled: true,
      questionCount: concurso.specific_knowledge_2_questions || 0,
      weight: concurso.specific_knowledge_2_weight || 1
    });
  }
  
  if (concurso.has_specific_knowledge_3) {
    disciplines.push({
      name: 'Conhecimentos Específicos 3',
      type: 'specific3',
      isEnabled: true,
      questionCount: concurso.specific_knowledge_3_questions || 0,
      weight: concurso.specific_knowledge_3_weight || 1
    });
  }
  
  return disciplines;
};

// Atualizar os nomes de exibição para disciplinas customizadas
export const updateSectionDisplayNames = (concurso: Concurso) => {
  const displayNames = { ...sectionDisplayNames };
  
  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    const disciplines = getDisciplines(concurso);
    
    disciplines.forEach(discipline => {
      if (discipline.isEnabled && discipline.type && discipline.name) {
        displayNames[discipline.type] = discipline.name;
      }
    });
  }
  
  return displayNames;
};
