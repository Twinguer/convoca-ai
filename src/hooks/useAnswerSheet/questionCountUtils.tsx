
import React from 'react';

export const getTotalQuestions = (concurso: any) => {
  if (!concurso) return 0;
  
  // For subject-based exams
  if (concurso.minimum_score_type === 'subject' && concurso.subjects) {
    try {
      const subjects = typeof concurso.subjects === 'string' 
        ? JSON.parse(concurso.subjects) 
        : concurso.subjects;
        
      if (Array.isArray(subjects)) {
        return subjects.reduce((acc, subject) => acc + (subject.questions || 0), 0);
      }
    } catch (e) {
      console.error('Error parsing subjects:', e);
    }
  }
  
  // For traditional knowledge-based exams
  let total = 0;
  
  if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
    total += concurso.basic_knowledge_questions;
  }
  
  if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
    total += concurso.specific_knowledge_1_questions;
  }
  
  if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
    total += concurso.specific_knowledge_2_questions;
  }
  
  if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
    total += concurso.specific_knowledge_3_questions;
  }
  
  return total;
};

export const getAnsweredQuestionsCount = (answers: { [key: number]: string }) => {
  return Object.keys(answers).length;
};
