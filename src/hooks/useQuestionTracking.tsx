import { useStudyStatistics } from './useStudyStatistics';

export const useQuestionTracking = () => {
  const { addQuestionResult } = useStudyStatistics();

  const trackAnswer = (userAnswer: string, correctAnswer: string) => {
    const isCorrect = userAnswer.toUpperCase() === correctAnswer.toUpperCase();
    addQuestionResult(isCorrect);
    return isCorrect;
  };

  return {
    trackAnswer
  };
};