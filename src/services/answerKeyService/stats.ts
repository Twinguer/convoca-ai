
import { AnswerKeyCompleteness, AnswerKeyStats } from './types';
import { getConsolidatedAnswerKey } from './core';

export const checkAnswerKeyCompleteness = async (
  concursoId: string, 
  bookletIds: string[], 
  expectedQuestions: number
): Promise<AnswerKeyCompleteness> => {
  try {
    console.log('[answerKeyService] Checking answer key completeness');
    
    const consolidatedData = await getConsolidatedAnswerKey(concursoId);
    
    if (!consolidatedData?.booklets) {
      return {
        allComplete: false,
        details: bookletIds.map(id => ({
          bookletId: id,
          bookletName: `Caderno ${id}`,
          completed: 0,
          total: expectedQuestions,
          isComplete: false
        }))
      };
    }

    const details = bookletIds.map(bookletId => {
      const booklet = consolidatedData.booklets[bookletId];
      const completed = booklet?.answers ? Object.keys(booklet.answers).length : 0;
      const isComplete = completed >= expectedQuestions;

      return {
        bookletId,
        bookletName: booklet?.metadata?.booklet_name || `Caderno ${bookletId}`,
        completed,
        total: expectedQuestions,
        isComplete
      };
    });

    const allComplete = details.every(detail => detail.isComplete);

    return {
      allComplete,
      details
    };
  } catch (error) {
    console.error('[answerKeyService] Error checking completeness:', error);
    return {
      allComplete: false,
      details: bookletIds.map(id => ({
        bookletId: id,
        bookletName: `Caderno ${id}`,
        completed: 0,
        total: expectedQuestions,
        isComplete: false
      }))
    };
  }
};

export const getAnswerKeyStats = async (concursoId: string): Promise<AnswerKeyStats> => {
  try {
    const consolidatedData = await getConsolidatedAnswerKey(concursoId);
    
    if (!consolidatedData?.booklets) {
      return {
        totalBooklets: 0,
        totalAnswers: 0,
        lastUpdated: null
      };
    }

    const booklets = consolidatedData.booklets;
    const totalBooklets = Object.keys(booklets).length;
    let totalAnswers = 0;

    Object.values(booklets).forEach((booklet: any) => {
      if (booklet.answers) {
        totalAnswers += Object.keys(booklet.answers).length;
      }
    });

    return {
      totalBooklets,
      totalAnswers,
      lastUpdated: consolidatedData.metadata?.last_updated || null
    };
  } catch (error) {
    console.error('[answerKeyService] Error getting stats:', error);
    return {
      totalBooklets: 0,
      totalAnswers: 0,
      lastUpdated: null
    };
  }
};
