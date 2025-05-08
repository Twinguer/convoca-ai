
import { Concurso } from '@/types/concursos';

export const initializeQuestionTypes = (
  concurso: Concurso,
  questionType: { [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' | string },
  setQuestionType: React.Dispatch<React.SetStateAction<{ [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' | string }>>
) => {
  if (concurso && Object.keys(questionType).length === 0) {
    const typesMap: { [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' | string } = {};
    let questionNumber = 1;
    
    // Handle knowledge sections
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
    
    // Handle disciplines
    if (concurso.disciplines && Array.isArray(concurso.disciplines) && concurso.disciplines.length > 0) {
      for (const discipline of concurso.disciplines) {
        for (let i = 0; i < discipline.questions; i++) {
          typesMap[questionNumber] = discipline.sigla;
          questionNumber++;
        }
      }
    }
    
    console.log('Initialized question types mapping:', typesMap);
    setQuestionType(typesMap);
  }
};
