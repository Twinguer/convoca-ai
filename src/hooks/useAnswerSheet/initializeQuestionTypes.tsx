
import React from 'react';

export const initializeQuestionTypes = (
  concurso: any,
  questionType: { [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' },
  setQuestionType: React.Dispatch<React.SetStateAction<{ [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' }>>
) => {
  if (Object.keys(questionType).length === 0) {
    const typesMap: { [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' } = {};
    
    // For subject-based exams
    if (concurso.minimum_score_type === 'subject' && concurso.subjects) {
      try {
        const subjects = typeof concurso.subjects === 'string' 
          ? JSON.parse(concurso.subjects) 
          : concurso.subjects;
          
        if (Array.isArray(subjects)) {
          let currentQuestion = 1;
          
          subjects.forEach(subject => {
            for (let i = 0; i < (subject.questions || 0); i++) {
              typesMap[currentQuestion] = 'basic'; // Use 'basic' as default section type
              currentQuestion++;
            }
          });
        }
      } catch (e) {
        console.error('Error parsing subjects:', e);
      }
    }
    // For traditional knowledge-based exams
    else {
      let questionNumber = 1;
      
      if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
        for (let i = 0; i < concurso.basic_knowledge_questions; i++) {
          typesMap[questionNumber] = 'basic';
          questionNumber++;
        }
      }
      
      if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
        for (let i = 0; i < concurso.specific_knowledge_1_questions; i++) {
          typesMap[questionNumber] = 'specific1';
          questionNumber++;
        }
      }
      
      if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
        for (let i = 0; i < concurso.specific_knowledge_2_questions; i++) {
          typesMap[questionNumber] = 'specific2';
          questionNumber++;
        }
      }
      
      if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
        for (let i = 0; i < concurso.specific_knowledge_3_questions; i++) {
          typesMap[questionNumber] = 'specific3';
          questionNumber++;
        }
      }
    }
    
    setQuestionType(typesMap);
  }
};
