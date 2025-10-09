
import { Concurso } from '@/types/concursos';

export const prepareAnswersData = (
  answers: { [key: number]: string },
  concurso: Concurso,
  nullifiedQuestions?: Set<number>
) => {
  // Logs removidos por segurança
  
  // Verificar se há respostas para processar
  if (!answers || typeof answers !== 'object') {
    // Log removido por segurança
    return {};
  }

  // Preparar os dados de respostas no formato de OBJETO (como o gabarito oficial)
  const answersObject: { [key: string]: string } = {};
  
  // Processar respostas válidas
  Object.entries(answers).forEach(([questionNumber, answer]) => {
    // Filtrar respostas válidas (não vazias e não undefined)
    if (answer && answer.trim() !== '') {
      answersObject[questionNumber] = answer.trim();
    }
  });
  
  // Log removido por segurança
  
  // Adicionar todas as questões anuladas com uma resposta padrão
  if (nullifiedQuestions && nullifiedQuestions.size > 0) {
    nullifiedQuestions.forEach(questionNumber => {
      if (!answers[questionNumber]) {
        const defaultAnswer = concurso.exam_type === 'Certo ou Errado' ? 'C' : 'A';
        answersObject[questionNumber.toString()] = defaultAnswer;
      }
    });
  }

  // Log removido por segurança
  return answersObject;
};
