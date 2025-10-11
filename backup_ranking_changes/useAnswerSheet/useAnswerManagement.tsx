
import { useState } from 'react';

interface UseAnswerManagementResult {
  answers: { [key: number]: string };
  setAnswers: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>;
  handleAnswerChange: (questionNumber: number, answer: string) => void;
  handleClearAnswer: (questionNumber: number) => void;
  clearAllAnswers: () => void;
}

export const useAnswerManagement = (): UseAnswerManagementResult => {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});

  const handleAnswerChange = (questionNumber: number, answer: string) => {
    // Log removido por segurança
    setAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [questionNumber]: answer
      };
      // Log removido por segurança
      return newAnswers;
    });
  };

  const handleClearAnswer = (questionNumber: number) => {
    // Log removido por segurança
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[questionNumber];
      // Log removido por segurança
      return newAnswers;
    });
  };

  const clearAllAnswers = () => {
    // Log removido por segurança
    setAnswers({});
  };

  return {
    answers,
    setAnswers,
    handleAnswerChange,
    handleClearAnswer,
    clearAllAnswers
  };
};
