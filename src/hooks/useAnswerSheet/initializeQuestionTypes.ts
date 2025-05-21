
import { Concurso, SectionType } from '@/types/concursos';
import { getNumericValue, isHierarchicalStructure } from '@/integrations/supabase/rankings/examStructure';

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
      console.log('Initializing custom knowledge structure');
      
      // Verificar se estamos lidando com a estrutura de blocos
      const hierarchical = isHierarchicalStructure(concurso);
      
      console.log('Using hierarchical structure:', hierarchical);
      
      if (hierarchical) {
        // Processar estrutura hierárquica
        for (const block of concurso.disciplines as any[]) {
          console.log(`Processing block: ${block.name}`);
          
          // Verificar se o bloco tem disciplines e é um array
          if (block.disciplines && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled) {
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
        // Processar estrutura plana legada para compatibilidade (ajustado para iterar sobre blocos e disciplinas aninhadas)
console.log('Processing flat structure for backward compatibility (adjusted)');

// Iterar sobre os blocos
for (const block of concurso.disciplines as any[]) { // Manter as any[] por enquanto para compatibilidade com dados, idealmente remover após refatoração completa
  // Verificar se o bloco tem disciplines e é um array
  if (block.disciplines && Array.isArray(block.disciplines)) {
    // Iterar sobre as disciplinas aninhadas dentro do bloco
    for (const discipline of block.disciplines) {
      if (discipline.isEnabled && discipline.type) {
        const questionCount = getNumericValue(discipline.questionCount);

        console.log(`Block ${block.name}, Discipline ${discipline.name} (${discipline.type}) has ${questionCount} questions, starting from ${questionNumber}`); // Log ajustado para incluir nome do bloco

        for (let i = 0; i < questionCount; i++) {
          typesMap[questionNumber] = discipline.type as SectionType;
          questionNumber++;
        }
      } else {
        console.log(`Skipping disabled discipline or invalid type in block ${block.name}:`, discipline); // Log ajustado
      }
    }
  } else {
      console.log(`Skipping block with no disciplines or invalid structure:`, block); // Log para blocos sem disciplinas aninhadas
  }
}
// Manter o restante do código que estava após este trecho, começando com os else
}
} else {
  // Processar estrutura tradicional (legado)
  console.log('Processing traditional structure (legacy)');   
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
