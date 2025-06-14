
import { Concurso } from '@/types/concursos';

export const prepareAnswersData = (
  answers: { [key: number]: string },
  concurso: Concurso,
  nullifiedQuestions?: Set<number>
) => {
  // Preparar os dados de respostas no formato correto para a função RPC
  const answersArray = Object.entries(answers).map(([questionNumber, answer]) => {
    const qNum = parseInt(questionNumber, 10);
    
    return {
      questionNumber: qNum,
      answer: answer.trim()
    };
  });
  
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

  return answersArray;
};
