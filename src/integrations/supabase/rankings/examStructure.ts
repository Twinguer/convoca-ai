
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

// Helper function to check if exam structure is hierarchical (blocks and disciplines)
export const isHierarchicalStructure = (concurso: Concurso): boolean => {
  // Check if discipline_blocks is defined and has items
  if (concurso?.discipline_blocks && 
      Array.isArray(concurso.discipline_blocks) && 
      concurso.discipline_blocks.length > 0) {
    return true;
  }
  return false;
};

// Helper function to safely handle the disciplines array
export const getDisciplines = (concurso: Concurso) => {
  // Handle hierarchical structure first
  if (isHierarchicalStructure(concurso)) {
    // For hierarchical structure, flatten all disciplines from all blocks
    let allDisciplines: any[] = [];
    
    if (concurso.discipline_blocks && Array.isArray(concurso.discipline_blocks)) {
      concurso.discipline_blocks.forEach(block => {
        if (block.disciplines && Array.isArray(block.disciplines)) {
          // Add block information to each discipline
          const disciplinesWithBlock = block.disciplines.map(discipline => ({
            ...discipline,
            blockId: block.id,
            blockName: block.name,
            blockWeight: block.weight
          }));
          allDisciplines = [...allDisciplines, ...disciplinesWithBlock];
        }
      });
    }
    
    return allDisciplines;
  }
  
  // If not hierarchical, use the regular disciplines array if available
  if (!concurso.disciplines) {
    return [];
  }
  
  // If it's a string JSON, try to parse it
  if (typeof concurso.disciplines === 'string') {
    try {
      return JSON.parse(concurso.disciplines);
    } catch (e) {
      console.error('Error parsing disciplines JSON:', e);
      return [];
    }
  }
  
  // If already an array, return it
  if (Array.isArray(concurso.disciplines)) {
    return concurso.disciplines;
  }
  
  // If it's an object, check if it's a JSONB object from Postgres
  return concurso.disciplines || [];
};

// Helper function to get all blocks
export const getBlocks = (concurso: Concurso) => {
  if (isHierarchicalStructure(concurso) && 
      concurso.discipline_blocks && 
      Array.isArray(concurso.discipline_blocks)) {
    return concurso.discipline_blocks;
  }
  return [];
};

// Função para obter a estrutura de exame de um concurso
export const getExamStructure = (concurso: Concurso) => {
  // Estrutura básica que será retornada
  const examStructure = {
    // Agora apenas usamos o modo customizável
    hasCustomKnowledge: true,
    disciplines: getDisciplines(concurso),
    
    // Configurações de exame
    exam_type: concurso.exam_type || 'Alternativas',
    alternatives_count: getNumericValue(concurso.alternatives_count),
    wrong_answer_penalty: getNumericValue(concurso.wrong_answer_penalty),
    
    // New - Hierarchical structure information
    isHierarchical: isHierarchicalStructure(concurso),
    blocks: getBlocks(concurso),
    
    // Para compatibilidade com código que ainda usa essas propriedades
    hasBasicKnowledge: false,
    hasSpecificKnowledge1: false,
    hasSpecificKnowledge2: false,
    hasSpecificKnowledge3: false,
    hasDiscursive: concurso.has_discursive === true,
    hasCaseStudy1: concurso.has_case_study_1 === true,
    hasCaseStudy2: concurso.has_case_study_2 === true,
    hasCaseStudy3: concurso.has_case_study_3 === true,
    
    basicKnowledgeWeight: getNumericValue(concurso.basic_knowledge_weight),
    specificKnowledge1Weight: getNumericValue(concurso.specific_knowledge_1_weight),
    specificKnowledge2Weight: getNumericValue(concurso.specific_knowledge_2_weight),
    specificKnowledge3Weight: getNumericValue(concurso.specific_knowledge_3_weight),
    discursiveWeight: getNumericValue(concurso.discursive_weight),
    caseStudy1Weight: getNumericValue(concurso.case_study_1_weight),
    caseStudy2Weight: getNumericValue(concurso.case_study_2_weight),
    caseStudy3Weight: getNumericValue(concurso.case_study_3_weight),
  };
  
  // Configurar valores para compatibilidade
  const disciplines = examStructure.disciplines;
  disciplines.forEach(discipline => {
    if (discipline.isEnabled) {
      if (discipline.type === 'basic') examStructure.hasBasicKnowledge = true;
      else if (discipline.type === 'specific1') examStructure.hasSpecificKnowledge1 = true;
      else if (discipline.type === 'specific2') examStructure.hasSpecificKnowledge2 = true;
      else if (discipline.type === 'specific3') examStructure.hasSpecificKnowledge3 = true;
    }
  });
  
  return examStructure;
};

// Function to get display name for section
export const getSectionDisplayName = (concurso: Concurso, sectionType: string): string => {
  // Check standard section names first
  if (sectionDisplayNames[sectionType]) {
    return sectionDisplayNames[sectionType];
  }
  
  // Check for custom disciplines
  const disciplines = getDisciplines(concurso);
  const discipline = disciplines.find((d: any) => d.type === sectionType);
  if (discipline) {
    return discipline.name || sectionType;
  }
  
  return sectionType;
};

// Função para atualizar os nomes de exibição com disciplinas customizadas
export const updateSectionDisplayNames = (concurso: Concurso): Record<string, string> => {
  // Criar uma cópia do objeto padrão
  const updatedNames = { ...sectionDisplayNames };
  
  // Adicionar nomes das disciplinas ao mapeamento
  const disciplines = getDisciplines(concurso);
  if (Array.isArray(disciplines)) {
    disciplines.forEach((discipline: any) => {
      if (discipline.type && discipline.name) {
        updatedNames[discipline.type] = discipline.name;
      }
    });
  }
  
  return updatedNames;
};

// Lista de tipos de seção válidos para o banco de dados
export const validSectionTypes = ['basic', 'specific1', 'specific2', 'specific3', 'discursive', 'case_study1', 'case_study2', 'case_study3'];

// Função para sanitizar tipos de seção para garantir compatibilidade com o banco de dados
export const sanitizeSectionType = (sectionType: string): string => {
  // Para tipos padrão, retorna como está
  if (validSectionTypes.includes(sectionType)) {
    return sectionType;
  }
  
  // Para disciplinas customizadas, permitimos que o tipo original seja mantido
  // O banco de dados aceita tipos customizados (por exemplo, que começam com 'custom_')
  return sectionType;
};

// Função auxiliar para determinar o tipo de seção com base no número da questão
export const getSectionTypeForQuestion = (concurso: Concurso, questionNumber: number): SectionType => {
  if (isHierarchicalStructure(concurso)) {
    // For hierarchical structure, go through each block and its disciplines
    let currentQuestionNumber = 1;
    
    if (concurso.discipline_blocks && Array.isArray(concurso.discipline_blocks)) {
      for (const block of concurso.discipline_blocks) {
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.questionCount) {
              const questionCount = getNumericValue(discipline.questionCount);
              if (questionCount > 0 && 
                  questionNumber >= currentQuestionNumber && 
                  questionNumber < currentQuestionNumber + questionCount) {
                return sanitizeSectionType(discipline.type) as SectionType;
              }
              currentQuestionNumber += questionCount;
            }
          }
        }
      }
    }
  } else {
    // Traditional flat structure
    const disciplines = getDisciplines(concurso);
    let currentIndex = 1;
    
    for (const discipline of disciplines) {
      if (discipline.isEnabled && discipline.questionCount) {
        const disciplineQuestions = getNumericValue(discipline.questionCount);
        if (disciplineQuestions > 0 && 
            questionNumber >= currentIndex && 
            questionNumber <= currentIndex + disciplineQuestions - 1) {
          return sanitizeSectionType(discipline.type) as SectionType;
        }
        currentIndex += disciplineQuestions;
      }
    }
  }
  
  // Fallback para conhecimentos específicos genéricos
  console.warn(`Questão ${questionNumber} não encontrada em nenhuma disciplina`);
  return 'specific1';
};

// Helper function to get discipline data for a specific question
export const getDisciplineForQuestion = (concurso: Concurso, questionNumber: number): any => {
  if (isHierarchicalStructure(concurso)) {
    // For hierarchical structure
    let currentQuestionNumber = 1;
    
    if (concurso.discipline_blocks && Array.isArray(concurso.discipline_blocks)) {
      for (const block of concurso.discipline_blocks) {
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.questionCount) {
              const questionCount = getNumericValue(discipline.questionCount);
              if (questionCount > 0 && 
                  questionNumber >= currentQuestionNumber && 
                  questionNumber < currentQuestionNumber + questionCount) {
                return {
                  ...discipline,
                  blockId: block.id,
                  blockName: block.name
                };
              }
              currentQuestionNumber += questionCount;
            }
          }
        }
      }
    }
  } else {
    // Traditional flat structure
    const disciplines = getDisciplines(concurso);
    let currentIndex = 1;
    
    for (const discipline of disciplines) {
      if (discipline.isEnabled && discipline.questionCount) {
        const disciplineQuestions = getNumericValue(discipline.questionCount);
        if (disciplineQuestions > 0 && 
            questionNumber >= currentIndex && 
            questionNumber <= currentIndex + disciplineQuestions - 1) {
          return discipline;
        }
        currentIndex += disciplineQuestions;
      }
    }
  }
  
  return null;
};
