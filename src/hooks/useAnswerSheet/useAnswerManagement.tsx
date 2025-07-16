
import { useState } from 'react';

interface UseAnswerManagementResult {
  answers: { [key: number]: string };
  setAnswers: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>;
  handleAnswerChange: (questionNumber: number, answer: string) => void;
  handleClearAnswer: (questionNumber: number) => void;
}

export const useAnswerManagement = (): UseAnswerManagementResult => {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});

  const handleAnswerChange = (questionNumber: number, answer: string) => {
    console.log(`[useAnswerManagement] Changing answer for question ${questionNumber} to ${answer}`);
    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [questionNumber]: answer
      };
      console.log(`[useAnswerManagement] New answers state:`, newAnswers);
      return newAnswers;
    });
  };

  const handleClearAnswer = (questionNumber: number) => {
    console.log(`[useAnswerManagement] Clearing answer for question ${questionNumber}`);
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[questionNumber];
      console.log(`[useAnswerManagement] New answers state after clear:`, newAnswers);
      return newAnswers;
    });
  };

  return {
    answers,
    setAnswers,
    handleAnswerChange,
    handleClearAnswer
  };
};
