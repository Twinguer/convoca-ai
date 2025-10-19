
import { Concurso } from '@/types/concursos';
import { getSectionTypeForQuestion } from '@/integrations/supabase/rankings/examStructure';

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
  subjectScores?: Record<string, number>,
  selectedBookletId?: string
) => {
  console.log('[prepareAnswersData] Input answers:', answers);
  console.log('[prepareAnswersData] Input nullifiedQuestions:', nullifiedQuestions);
  console.log('[prepareAnswersData] Input selectedBookletId:', selectedBookletId);
  
  // Validar que temos um caderno selecionado
  if (!selectedBookletId) {
    console.error('[prepareAnswersData] selectedBookletId é obrigatório');
    return { answers: {}, subjectScores: subjectScores || {} };
  }
  
  // Verificar se há respostas para processar
  if (!answers || typeof answers !== 'object') {
    console.log('[prepareAnswersData] No answers provided or invalid format');
    return { answers: {}, subjectScores: subjectScores || {} };
  }

  // Estrutura correta: {bookletId: {disciplineType: {questionNumber: answer}}}
  const organizedAnswers: { [bookletId: string]: { [disciplineType: string]: { [questionNumber: string]: string } } } = {};
  
  // Obter o gabarito oficial para mapear section_type
  const officialAnswers = concurso.official_answers?.[selectedBookletId]?.questions || {};
  console.log('[prepareAnswersData] Official answers for mapping:', officialAnswers);

  // Inicializar estrutura do caderno
  organizedAnswers[selectedBookletId] = {};

  // Processar todas as respostas com mapeamento de disciplina
  Object.entries(answers).forEach(([questionNum, answer]) => {
    if (answer && answer.trim() !== '') {
      const questionNumber = parseInt(questionNum);
      const officialAnswer = officialAnswers[questionNum];
      
      // CORREÇÃO: Usar a estrutura do concurso para mapear disciplina em vez do section_type do gabarito
      const sectionType = getSectionTypeForQuestion(concurso, questionNumber);
      
      console.log(`[prepareAnswersData] Questão ${questionNumber} mapeada para disciplina: ${sectionType}`);
      
      // Inicializar disciplina se não existir
      if (!organizedAnswers[selectedBookletId][sectionType]) {
        organizedAnswers[selectedBookletId][sectionType] = {};
      }
      
      organizedAnswers[selectedBookletId][sectionType][questionNum] = answer.trim();
    }
  });
  
  // Adicionar questões anuladas com resposta padrão
  if (nullifiedQuestions && nullifiedQuestions.size > 0) {
    nullifiedQuestions.forEach(questionNumber => {
      if (!answers[questionNumber]) {
        const defaultAnswer = concurso.exam_type === 'Certo ou Errado' ? 'C' : 'A';
        
        // CORREÇÃO: Usar a estrutura do concurso para mapear disciplina em vez do section_type do gabarito
        const sectionType = getSectionTypeForQuestion(concurso, questionNumber);
        
        console.log(`[prepareAnswersData] Questão anulada ${questionNumber} mapeada para disciplina: ${sectionType}`);
        
        // Inicializar disciplina se não existir
        if (!organizedAnswers[selectedBookletId][sectionType]) {
          organizedAnswers[selectedBookletId][sectionType] = {};
        }
        
        organizedAnswers[selectedBookletId][sectionType][questionNumber.toString()] = defaultAnswer;
      }
    });
  }

  console.log('[prepareAnswersData] Organized answers structure:', organizedAnswers);
  console.log('[prepareAnswersData] Subject scores:', subjectScores);
  console.log('[prepareAnswersData] BookletId:', selectedBookletId);
  
  return {
    answers: organizedAnswers,
    subjectScores: subjectScores || {},
    bookletId: selectedBookletId
  };
};
