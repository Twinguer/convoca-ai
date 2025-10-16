
import { Concurso } from '@/types/concursos';

// Função auxiliar para obter valor numérico
const getNumericValue = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const prepareAnswersData = (
  answers: { [key: number]: string },
  concurso: Concurso,
  nullifiedQuestions?: Set<number>,
  subjectScores?: Record<string, number>
) => {
  console.log('[prepareAnswersData] Input answers:', answers);
  console.log('[prepareAnswersData] Input nullifiedQuestions:', nullifiedQuestions);
  
  // Verificar se há respostas para processar
  if (!answers || typeof answers !== 'object') {
    console.log('[prepareAnswersData] No answers provided or invalid format');
    return { answers: {}, subjectScores: subjectScores || {} };
  }

  // Estrutura hierárquica para respostas organizadas por blocos e disciplinas
  let organizedAnswers: any = {};
  
  // Verificar se é estrutura hierárquica (blocos -> disciplinas)
  const isHierarchicalStructure = concurso.disciplines && 
    concurso.disciplines.length > 0 && 
    concurso.disciplines[0] && 
    typeof concurso.disciplines[0] === 'object' && 
    'name' in concurso.disciplines[0] && 
    'disciplines' in concurso.disciplines[0];

  if (isHierarchicalStructure) {
    // Estrutura hierárquica (blocos -> disciplinas)
    // Primeiro, calcular o número da primeira questão de cada bloco para ordenação
    const blocksWithStartQuestion = concurso.disciplines.map(block => {
      if ('disciplines' in block) {
        let startQuestion = 1;
        let currentQuestion = 1;
        
        // Encontrar o bloco anterior para calcular o número inicial
        const blockIndex = concurso.disciplines.indexOf(block);
        for (let i = 0; i < blockIndex; i++) {
          const prevBlock = concurso.disciplines[i];
          if ('disciplines' in prevBlock) {
            for (const discipline of prevBlock.disciplines) {
              if (discipline.isEnabled) {
                const questionCount = getNumericValue(discipline.questionCount);
                currentQuestion += questionCount;
              }
            }
          }
        }
        startQuestion = currentQuestion;
        
        return {
          block,
          startQuestion,
          blockId: block.id || `bloco_${block.name.toLowerCase().replace(/\s+/g, '_')}`
        };
      }
      return null;
    }).filter(Boolean);
    
    // Ordenar blocos por número da primeira questão
    blocksWithStartQuestion.sort((a, b) => a!.startQuestion - b!.startQuestion);
    
    console.log('[prepareAnswersData] Blocks ordered by start question:', blocksWithStartQuestion.map(b => ({
      blockId: b!.blockId,
      startQuestion: b!.startQuestion
    })));
    
    // Processar blocos na ordem correta
    for (const { block, blockId } of blocksWithStartQuestion) {
      organizedAnswers[blockId] = {};
      
      for (const discipline of block.disciplines) {
        if (discipline.isEnabled) {
          const disciplineId = discipline.type; // SEMPRE usar type, não id
          organizedAnswers[blockId][disciplineId] = {};
          
          const questionCount = getNumericValue(discipline.questionCount);
          
          // Calcular número da primeira questão desta disciplina
          let disciplineStartQuestion = 1;
          const disciplineIndex = block.disciplines.indexOf(discipline);
          for (let i = 0; i < disciplineIndex; i++) {
            const prevDiscipline = block.disciplines[i];
            if (prevDiscipline.isEnabled) {
              disciplineStartQuestion += getNumericValue(prevDiscipline.questionCount);
            }
          }
          
          // Adicionar offset do bloco
          const blockStartQuestion = blocksWithStartQuestion.find(b => b!.blockId === blockId)!.startQuestion;
          disciplineStartQuestion += blockStartQuestion - 1;
          
          // Organizar questões desta disciplina
          for (let i = 0; i < questionCount; i++) {
            const questionNumber = disciplineStartQuestion + i;
            const answer = answers[questionNumber];
            
            if (answer && answer.trim() !== '') {
              organizedAnswers[blockId][disciplineId][questionNumber.toString()] = answer.trim();
            } else if (nullifiedQuestions && nullifiedQuestions.has(questionNumber)) {
              // Questão anulada - usar resposta padrão
              const defaultAnswer = concurso.exam_type === 'Certo ou Errado' ? 'C' : 'A';
              organizedAnswers[blockId][disciplineId][questionNumber.toString()] = defaultAnswer;
            }
          }
        }
      }
    }
  } else {
    // Estrutura plana - manter compatibilidade
    const answersObject: { [key: string]: string } = {};
    
    Object.entries(answers).forEach(([questionNumber, answer]) => {
      if (answer && answer.trim() !== '') {
        answersObject[questionNumber] = answer.trim();
      }
    });
    
    // Adicionar questões anuladas
    if (nullifiedQuestions && nullifiedQuestions.size > 0) {
      nullifiedQuestions.forEach(questionNumber => {
        if (!answers[questionNumber]) {
          const defaultAnswer = concurso.exam_type === 'Certo ou Errado' ? 'C' : 'A';
          answersObject[questionNumber.toString()] = defaultAnswer;
        }
      });
    }
    
    organizedAnswers = answersObject;
  }

  console.log('[prepareAnswersData] Organized answers structure:', organizedAnswers);
  console.log('[prepareAnswersData] Subject scores:', subjectScores);
  
  return {
    answers: organizedAnswers,
    subjectScores: subjectScores || {}
  };
};
