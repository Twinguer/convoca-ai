
import { Concurso } from '@/types/concursos';

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
  
  console.log('[prepareAnswersData] Processed answers before nullified:', answersObject);
  
  // Adicionar todas as questões anuladas com uma resposta padrão
  if (nullifiedQuestions && nullifiedQuestions.size > 0) {
    nullifiedQuestions.forEach(questionNumber => {
      if (!answers[questionNumber]) {
        const defaultAnswer = concurso.exam_type === 'Certo ou Errado' ? 'C' : 'A';
        answersObject[questionNumber.toString()] = defaultAnswer;
      }
    });
  }

  console.log('[prepareAnswersData] Final answers object:', answersObject);
  console.log('[prepareAnswersData] Subject scores:', subjectScores);
  
  return {
    answers: answersObject,
    subjectScores: subjectScores || {}
  };
};
