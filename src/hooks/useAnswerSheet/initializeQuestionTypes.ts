
import { Concurso } from "@/types/concursos";
import { Dispatch, SetStateAction } from "react";
import { SectionType } from "@/integrations/supabase/rankings/examStructure";

export const initializeQuestionTypes = (
  concurso: Concurso,
  questionType: { [key: number]: SectionType },
  setQuestionType: Dispatch<SetStateAction<{ [key: number]: SectionType }>>
) => {
  // Check if questionType is already initialized
  if (Object.keys(questionType).length > 0) {
    return; // Don't reinitialize if already has values
  }

  // Create a temporary object to hold question types
  const types: { [key: number]: SectionType } = {};
  
  let questionNumber = 1;
  
  // Basic Knowledge questions
  if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
    for (let i = 0; i < concurso.basic_knowledge_questions; i++) {
      types[questionNumber] = 'basic';
      questionNumber++;
    }
  }
  
  // Specific Knowledge 1 questions
  if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
    for (let i = 0; i < concurso.specific_knowledge_1_questions; i++) {
      types[questionNumber] = 'specific1';
      questionNumber++;
    }
  }
  
  // Specific Knowledge 2 questions
  if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
    for (let i = 0; i < concurso.specific_knowledge_2_questions; i++) {
      types[questionNumber] = 'specific2';
      questionNumber++;
    }
  }
  
  // Specific Knowledge 3 questions
  if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
    for (let i = 0; i < concurso.specific_knowledge_3_questions; i++) {
      types[questionNumber] = 'specific3';
      questionNumber++;
    }
  }
  
  // Custom disciplines
  if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
    concurso.disciplines.forEach(discipline => {
      if (discipline.isEnabled && discipline.questionCount) {
        for (let i = 0; i < discipline.questionCount; i++) {
          types[questionNumber] = discipline.type;
          questionNumber++;
        }
      }
    });
  }
  
  setQuestionType(types);
};
