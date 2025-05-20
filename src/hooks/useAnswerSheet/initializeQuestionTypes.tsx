
import { Concurso, SectionType } from '@/types/concursos';
import { getNumericValue } from '@/integrations/supabase/rankings/examStructure';

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
    if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
      console.log('Initializing hierarchical question types structure');
      
      // Verificar se estamos lidando com a estrutura de blocos
      const isHierarchical = concurso.disciplines[0] && 
                            typeof concurso.disciplines[0] === 'object' && 
                            'name' in concurso.disciplines[0] && 
                            'disciplines' in (concurso.disciplines[0] as any);
      
      if (isHierarchical) {
        // Processar a estrutura hierárquica
        for (const block of concurso.disciplines as any[]) {
          console.log(`Processing block: ${block.name}`);
          
          // Verificar se o bloco tem disciplines e é um array
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
      } else {
        // Processar estrutura plana legada para compatibilidade
        console.log('Processing flat structure for backward compatibility');
        
        for (const discipline of concurso.disciplines) {
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
        }
      }
    } else {
      // Estrutura tradicional
      if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
        const basicCount = getNumericValue(concurso.basic_knowledge_questions);
        console.log(`Traditional structure: basic knowledge has ${basicCount} questions`);
        for (let i = 0; i < basicCount; i++) {
          typesMap[questionNumber] = 'basic';
          questionNumber++;
        }
      }
      
      if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
        const count = getNumericValue(concurso.specific_knowledge_1_questions);
        console.log(`Traditional structure: specific knowledge 1 has ${count} questions`);
        for (let i = 0; i < count; i++) {
          typesMap[questionNumber] = 'specific1';
          questionNumber++;
        }
      }
      
      if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
        const count = getNumericValue(concurso.specific_knowledge_2_questions);
        console.log(`Traditional structure: specific knowledge 2 has ${count} questions`);
        for (let i = 0; i < count; i++) {
          typesMap[questionNumber] = 'specific2';
          questionNumber++;
        }
      }
      
      if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
        const count = getNumericValue(concurso.specific_knowledge_3_questions);
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
