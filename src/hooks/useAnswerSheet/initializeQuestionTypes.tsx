
import { useState, useEffect } from 'react';
import { Concurso } from '@/types/concursos';
import { getSectionTypeForQuestion } from '@/integrations/supabase/rankings/examStructure';

export const initializeQuestionTypes = (
  concurso: Concurso, 
  questionType: { [key: number]: string },
  setQuestionType: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>
) => {
  // Se o mapeamento já tiver sido feito, não precisamos refazer
  if (Object.keys(questionType).length > 0) {
    return;
  }
  
  // Caso contrário, vamos inicializar o mapeamento com base na estrutura do concurso
  let questionCounter = 1;
  const questionTypeMap: { [key: number]: string } = {};

  // Conhecimentos básicos
  if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
    for (let i = 0; i < concurso.basic_knowledge_questions; i++) {
      questionTypeMap[questionCounter++] = 'basic';
    }
  }

  // Conhecimentos específicos 1
  if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
    for (let i = 0; i < concurso.specific_knowledge_1_questions; i++) {
      questionTypeMap[questionCounter++] = 'specific1';
    }
  }

  // Conhecimentos específicos 2
  if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
    for (let i = 0; i < concurso.specific_knowledge_2_questions; i++) {
      questionTypeMap[questionCounter++] = 'specific2';
    }
  }

  // Conhecimentos específicos 3
  if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
    for (let i = 0; i < concurso.specific_knowledge_3_questions; i++) {
      questionTypeMap[questionCounter++] = 'specific3';
    }
  }

  // Disciplinas customizadas
  if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
    concurso.disciplines.forEach(discipline => {
      if (discipline.isEnabled && discipline.questionCount) {
        for (let i = 0; i < discipline.questionCount; i++) {
          questionTypeMap[questionCounter++] = discipline.type;
        }
      }
    });
  }

  setQuestionType(questionTypeMap);
};
