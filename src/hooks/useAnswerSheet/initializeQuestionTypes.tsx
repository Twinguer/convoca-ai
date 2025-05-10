
import { Concurso, SectionType } from '@/types/concursos';

export const initializeQuestionTypes = (
  concurso: Concurso, 
  questionType: { [key: number]: SectionType },
  setQuestionType: React.Dispatch<React.SetStateAction<{ [key: number]: SectionType }>>
) => {
  if (concurso && Object.keys(questionType).length === 0) {
    console.log('Initializing question types for concurso:', concurso.id, concurso.titulo);
    const typesMap: { [key: number]: SectionType } = {};
    let questionNumber = 1;
    
    // Verificar se estamos usando conhecimentos customizáveis
    if (concurso.has_custom_knowledge) {
      console.log('Initializing custom knowledge question types, disciplines:', concurso.disciplines);
      
      // Inicializar disciplinas customizadas
      if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
        concurso.disciplines.forEach(discipline => {
          if (discipline.isEnabled && discipline.type) {
            const questionCount = typeof discipline.questionCount === 'number' 
              ? discipline.questionCount 
              : parseInt(discipline.questionCount?.toString() || '0');
              
            console.log(`Discipline ${discipline.name} (${discipline.type}) has ${questionCount} questions, starting from ${questionNumber}`);
            
            for (let i = 0; i < questionCount; i++) {
              typesMap[questionNumber] = discipline.type as SectionType;
              questionNumber++;
            }
          } else {
            console.log(`Skipping disabled discipline or invalid type:`, discipline);
          }
        });
      } else {
        console.warn('No disciplines array found in concurso with custom_knowledge enabled');
      }
    } else {
      // Estrutura tradicional
      if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
        const basicCount = typeof concurso.basic_knowledge_questions === 'number' 
          ? concurso.basic_knowledge_questions 
          : parseInt(concurso.basic_knowledge_questions.toString() || '0');
          
        console.log(`Traditional structure: basic knowledge has ${basicCount} questions`);
        for (let i = 0; i < basicCount; i++) {
          typesMap[questionNumber] = 'basic';
          questionNumber++;
        }
      }
      
      if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
        const count = typeof concurso.specific_knowledge_1_questions === 'number'
          ? concurso.specific_knowledge_1_questions
          : parseInt(concurso.specific_knowledge_1_questions.toString() || '0');
          
        console.log(`Traditional structure: specific knowledge 1 has ${count} questions`);
        for (let i = 0; i < count; i++) {
          typesMap[questionNumber] = 'specific1';
          questionNumber++;
        }
      }
      
      if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
        const count = typeof concurso.specific_knowledge_2_questions === 'number'
          ? concurso.specific_knowledge_2_questions
          : parseInt(concurso.specific_knowledge_2_questions.toString() || '0');
          
        console.log(`Traditional structure: specific knowledge 2 has ${count} questions`);
        for (let i = 0; i < count; i++) {
          typesMap[questionNumber] = 'specific2';
          questionNumber++;
        }
      }
      
      if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
        const count = typeof concurso.specific_knowledge_3_questions === 'number'
          ? concurso.specific_knowledge_3_questions
          : parseInt(concurso.specific_knowledge_3_questions.toString() || '0');
          
        console.log(`Traditional structure: specific knowledge 3 has ${count} questions`);
        for (let i = 0; i < count; i++) {
          typesMap[questionNumber] = 'specific3';
          questionNumber++;
        }
      }
    }
    
    console.log('Initialized question types mapping:', typesMap);
    setQuestionType(typesMap);
  } else if (concurso) {
    console.log('Question type already initialized:', Object.keys(questionType).length);
  } else {
    console.warn('No concurso object available for initializing question types');
  }
};
