
import { Concurso } from '@/types/concursos';

export const prepareAnswersData = (
  answers: { [key: number]: string },
  concurso: Concurso,
  nullifiedQuestions?: Set<number>
) => {
  console.log('[prepareAnswersData] Input answers:', answers);
  console.log('[prepareAnswersData] Input nullifiedQuestions:', nullifiedQuestions);
  
  // Verificar se há respostas para processar
  if (!answers || typeof answers !== 'object') {
    console.log('[prepareAnswersData] No answers provided or invalid format');
    return [];
  }

  // Preparar os dados de respostas no formato correto para a função RPC
  const answersArray = Object.entries(answers)
    .filter(([questionNumber, answer]) => {
      // Filtrar respostas válidas (não vazias e não undefined)
      return answer && answer.trim() !== '';
    })
    .map(([questionNumber, answer]) => {
      const qNum = parseInt(questionNumber, 10);
      
      return {
        questionNumber: qNum,
        answer: answer.trim()
      };
    });
  
  console.log('[prepareAnswersData] Processed answers before nullified:', answersArray);
  
  // Adicionar todas as questões anuladas com uma resposta padrão
  if (nullifiedQuestions && nullifiedQuestions.size > 0) {
    nullifiedQuestions.forEach(questionNumber => {
      if (!answers[questionNumber]) {
        const defaultAnswer = concurso.exam_type === 'Certo ou Errado' ? 'C' : 'A';
        
        answersArray.push({
          questionNumber,
          answer: defaultAnswer
        });
      }
    });
  }

  console.log('[prepareAnswersData] Final answers array:', answersArray);
  return answersArray;
};
