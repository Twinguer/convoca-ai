
import { Concurso, SectionType } from '@/types/concursos';
import { getDisciplines, getNumericValue } from '@/integrations/supabase/rankings/examStructure';

export const initializeQuestionTypes = (
  concurso: Concurso, 
  questionType: { [key: number]: SectionType },
  setQuestionType: React.Dispatch<React.SetStateAction<{ [key: number]: SectionType }>>
) => {
  if (!concurso) {
    console.warn('Nenhum concurso disponível para inicializar tipos de questões');
    return;
  }

  if (concurso && Object.keys(questionType).length === 0) {
    console.log('Initializing question types for concurso:', concurso.id, concurso.titulo);
    const typesMap: { [key: number]: SectionType } = {};
    let questionNumber = 1;
    
    // Verificar se estamos usando conhecimento customizado
    if (concurso.has_custom_knowledge && concurso.disciplines) {
      const disciplines = getDisciplines(concurso);
      
      console.log('Initializing custom knowledge question types, disciplines:', disciplines);
      
      if (Array.isArray(disciplines)) {
        disciplines.forEach(discipline => {
          if (discipline && discipline.isEnabled && discipline.type) {
            const questionCount = getNumericValue(discipline.questionCount);
              
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
        console.warn('No disciplines array found in concurso');
      }
    } else {
      // Usar estrutura tradicional de conhecimentos
      if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
        const count = getNumericValue(concurso.basic_knowledge_questions);
        console.log(`Adding ${count} basic knowledge questions starting from ${questionNumber}`);
        
        for (let i = 0; i < count; i++) {
          typesMap[questionNumber] = 'basic';
          questionNumber++;
        }
      }
      
      if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
        const count = getNumericValue(concurso.specific_knowledge_1_questions);
        console.log(`Adding ${count} specific1 questions starting from ${questionNumber}`);
        
        for (let i = 0; i < count; i++) {
          typesMap[questionNumber] = 'specific1';
          questionNumber++;
        }
      }
      
      if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
        const count = getNumericValue(concurso.specific_knowledge_2_questions);
        console.log(`Adding ${count} specific2 questions starting from ${questionNumber}`);
        
        for (let i = 0; i < count; i++) {
          typesMap[questionNumber] = 'specific2';
          questionNumber++;
        }
      }
      
      if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
        const count = getNumericValue(concurso.specific_knowledge_3_questions);
        console.log(`Adding ${count} specific3 questions starting from ${questionNumber}`);
        
        for (let i = 0; i < count; i++) {
          typesMap[questionNumber] = 'specific3';
          questionNumber++;
        }
      }
    }
    
    console.log('Initialized question types mapping with', Object.keys(typesMap).length, 'questions:', typesMap);
    setQuestionType(typesMap);
  } else if (concurso) {
    console.log('Question type already initialized with', Object.keys(questionType).length, 'entries');
  } else {
    console.warn('No concurso object available for initializing question types');
  }
};
