
import { Concurso, SectionType, isDisciplineBlock } from '@/types/concursos';

// Type for storing questions by section
export type SectionQuestions = {
  [key: string]: number[];
};

// Get a dictionary of sections with their corresponding question numbers
export const getSectionQuestionsDict = (concurso: Concurso): SectionQuestions => {
  const result: SectionQuestions = {};

  if (!concurso) return result;

  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    // Check if hierarchical (blocks -> disciplines)
    const isHierarchical = concurso.disciplines.length > 0 && 
                           isDisciplineBlock(concurso.disciplines[0]);

    let currentQuestionNumber = 1;

    if (isHierarchical) {
      // Process hierarchical structure
      for (const block of concurso.disciplines) {
        if (isDisciplineBlock(block)) {
          // Process each discipline in the block
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.type) {
              // Create array for this discipline if it doesn't exist
              if (!result[discipline.type]) {
                result[discipline.type] = [];
              }

              // Add question numbers for this discipline
              const questionCount = parseInt(String(discipline.questionCount), 10) || 0;
              for (let i = 0; i < questionCount; i++) {
                result[discipline.type].push(currentQuestionNumber);
                currentQuestionNumber++;
              }
            }
          }
        }
      }
    } else {
      // Process flat structure
      for (const discipline of concurso.disciplines) {
        if ('isEnabled' in discipline && discipline.isEnabled && discipline.type) {
          // Create array for this discipline if it doesn't exist
          if (!result[discipline.type]) {
            result[discipline.type] = [];
          }

          // Add question numbers for this discipline
          const questionCount = parseInt(String(discipline.questionCount), 10) || 0;
          for (let i = 0; i < questionCount; i++) {
            result[discipline.type].push(currentQuestionNumber);
            currentQuestionNumber++;
          }
        }
      }
    }
  } else {
    // Traditional sections
    let questionNumber = 1;

    // Basic knowledge
    if (concurso.has_basic_knowledge) {
      result['basic'] = [];
      const questionCount = parseInt(String(concurso.basic_knowledge_questions), 10) || 0;
      for (let i = 0; i < questionCount; i++) {
        result['basic'].push(questionNumber);
        questionNumber++;
      }
    }

    // Specific knowledge 1
    if (concurso.has_specific_knowledge_1) {
      result['specific1'] = [];
      const questionCount = parseInt(String(concurso.specific_knowledge_1_questions), 10) || 0;
      for (let i = 0; i < questionCount; i++) {
        result['specific1'].push(questionNumber);
        questionNumber++;
      }
    }

    // Specific knowledge 2
    if (concurso.has_specific_knowledge_2) {
      result['specific2'] = [];
      const questionCount = parseInt(String(concurso.specific_knowledge_2_questions), 10) || 0;
      for (let i = 0; i < questionCount; i++) {
        result['specific2'].push(questionNumber);
        questionNumber++;
      }
    }

    // Specific knowledge 3
    if (concurso.has_specific_knowledge_3) {
      result['specific3'] = [];
      const questionCount = parseInt(String(concurso.specific_knowledge_3_questions), 10) || 0;
      for (let i = 0; i < questionCount; i++) {
        result['specific3'].push(questionNumber);
        questionNumber++;
      }
    }

    // Discursive sections (no question numbers)
    if (concurso.has_discursive) {
      result['discursive'] = [];
    }

    if (concurso.has_case_study_1) {
      result['case_study1'] = [];
    }

    if (concurso.has_case_study_2) {
      result['case_study2'] = [];
    }

    if (concurso.has_case_study_3) {
      result['case_study3'] = [];
    }
  }

  return result;
};

// Create a grid matrix from an array of question numbers
export const createQuestionMatrix = (questionNumbers: number[], columnsCount = 4): (number | null)[][] => {
  if (!questionNumbers || questionNumbers.length === 0) {
    return [[null]];
  }

  const result: (number | null)[][] = [];
  let currentRow: (number | null)[] = [];

  questionNumbers.forEach((questionNumber, index) => {
    currentRow.push(questionNumber);

    if (currentRow.length === columnsCount || index === questionNumbers.length - 1) {
      // Pad the last row with nulls if needed
      while (currentRow.length < columnsCount) {
        currentRow.push(null);
      }
      result.push([...currentRow]);
      currentRow = [];
    }
  });

  return result;
};

// Get question matrix for a specific section
export const getQuestionMatrixForSection = (
  concurso: Concurso,
  section: SectionType,
  sectionQuestions: SectionQuestions
): (number | null)[][] => {
  if (!concurso || !section || !sectionQuestions) {
    return [[null]];
  }

  const questionNumbers = sectionQuestions[section] || [];
  
  return createQuestionMatrix(questionNumbers);
};
