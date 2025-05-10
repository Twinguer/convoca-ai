
import { Concurso, SectionType } from '@/types/concursos';

export const initializeQuestionTypes = (
  concurso: Concurso, 
  questionType: { [key: number]: SectionType },
  setQuestionType: React.Dispatch<React.SetStateAction<{ [key: number]: SectionType }>>
) => {
  if (concurso && Object.keys(questionType).length === 0) {
    const typesMap: { [key: number]: SectionType } = {};
    let questionNumber = 1;
    
    if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
      const basicCount = typeof concurso.basic_knowledge_questions === 'number' 
        ? concurso.basic_knowledge_questions 
        : 0;
        
      for (let i = 0; i < basicCount; i++) {
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
    
    if (concurso.has_custom_knowledge && concurso.custom_knowledge_questions) {
      for (let i = 0; i < concurso.custom_knowledge_questions; i++) {
        typesMap[questionNumber] = 'custom';
        questionNumber++;
      }
    }
    
    // Inicializar disciplinas customizadas
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      concurso.disciplines.forEach(discipline => {
        if (discipline.isEnabled && discipline.type && discipline.questionCount) {
          for (let i = 0; i < discipline.questionCount; i++) {
            typesMap[questionNumber] = discipline.type as SectionType;
            questionNumber++;
          }
        }
      });
    }
    
    console.log('Initialized question types mapping:', typesMap);
    setQuestionType(typesMap);
  }
};
