
import { Concurso, SectionType } from '@/types/concursos';
import { getDisciplines, getNumericValue, isHierarchicalStructure } from '@/integrations/supabase/rankings/examStructure';

export const initializeQuestionTypes = (
  concurso: Concurso, 
  questionType: { [key: number]: SectionType },
  setQuestionType: React.Dispatch<React.SetStateAction<{ [key: number]: SectionType }>>
) => {
  if (concurso && Object.keys(questionType).length === 0) {
    console.log('Initializing question types for concurso:', concurso.id, concurso.titulo);
    const typesMap: { [key: number]: SectionType } = {};
    let questionNumber = 1;
    
    // Check if using hierarchical structure
    if (isHierarchicalStructure(concurso)) {
      console.log('Initializing hierarchical discipline structure');
      
      if (concurso.discipline_blocks && Array.isArray(concurso.discipline_blocks)) {
        for (const block of concurso.discipline_blocks) {
          console.log(`Processing block: ${block.name}`);
          
          if (block.disciplines && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled && discipline.type) {
                const questionCount = getNumericValue(discipline.questionCount);
                
                console.log(`Block ${block.name}, Discipline ${discipline.name} (${discipline.type}) has ${questionCount} questions, starting from ${questionNumber}`);
                
                for (let i = 0; i < questionCount; i++) {
                  typesMap[questionNumber] = discipline.type as SectionType;
                  questionNumber++;
                }
              } else {
                console.log(`Skipping disabled discipline in block ${block.name}:`, discipline);
              }
            }
          }
        }
      }
    } else {
      // Traditional flat disciplines structure
      const disciplines = getDisciplines(concurso);
      
      console.log('Initializing custom knowledge question types, disciplines:', disciplines);
      
      if (Array.isArray(disciplines)) {
        disciplines.forEach(discipline => {
          if (discipline.isEnabled && discipline.type) {
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
    }
    
    console.log('Initialized question types mapping:', typesMap);
    setQuestionType(typesMap);
  } else if (concurso) {
    console.log('Question type already initialized:', Object.keys(questionType).length);
  } else {
    console.warn('No concurso object available for initializing question types');
  }
};
