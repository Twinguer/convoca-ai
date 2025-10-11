
import { useQuery } from '@tanstack/react-query';
import { getConsolidatedAnswerKey } from '@/services/answerKeyService';

export const useOfficialAnswerWeights = (concursoId: string, bookletId?: string) => {
  return useQuery({
    queryKey: ['official-answers-weights', concursoId, bookletId],
    queryFn: async () => {
      console.log('[useOfficialAnswerWeights] Fetching for concurso:', concursoId, 'booklet:', bookletId);
      
      const consolidatedData = await getConsolidatedAnswerKey(concursoId);
      
      if (!consolidatedData) {
        console.log('[useOfficialAnswerWeights] No consolidated data found');
        return [];
      }

      // Se um bookletId específico foi fornecido, retornar apenas seus dados
      if (bookletId && consolidatedData.booklets?.[bookletId]) {
        const bookletData = consolidatedData.booklets[bookletId];
        const answers = Object.entries(bookletData.answers || {}).map(([questionNum, answerData]: [string, any]) => ({
          question_number: parseInt(questionNum),
          correct_answer: answerData.correct_answer,
          weight: answerData.weight || 1.0,
          section_type: answerData.section_type,
          is_nullified: answerData.is_nullified || false,
          answer_format: answerData.answer_format || 'OBJECTIVE',
          question_type: answerData.question_type || 'MULTIPLE_CHOICE'
        }));
        
        console.log('[useOfficialAnswerWeights] Found', answers.length, 'answers for booklet:', bookletId);
        return answers;
      }

      // Se nenhum bookletId foi fornecido, retornar dados de todos os cadernos
      const allAnswers: any[] = [];
      Object.entries(consolidatedData.booklets || {}).forEach(([bookletKey, bookletData]: [string, any]) => {
        Object.entries(bookletData.answers || {}).forEach(([questionNum, answerData]: [string, any]) => {
          allAnswers.push({
            question_number: parseInt(questionNum),
            correct_answer: answerData.correct_answer,
            weight: answerData.weight || 1.0,
            section_type: answerData.section_type,
            is_nullified: answerData.is_nullified || false,
            answer_format: answerData.answer_format || 'OBJECTIVE',
            question_type: answerData.question_type || 'MULTIPLE_CHOICE',
            booklet_id: bookletKey
          });
        });
      });

      console.log('[useOfficialAnswerWeights] Found', allAnswers.length, 'total answers across all booklets');
      return allAnswers;
    },
    enabled: !!concursoId,
    staleTime: 30000,
  });
};
