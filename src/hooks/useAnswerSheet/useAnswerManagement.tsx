
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
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: answer
    }));
  };

  const handleClearAnswer = (questionNumber: number) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[questionNumber];
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
