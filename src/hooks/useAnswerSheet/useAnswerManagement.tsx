
import { useState } from 'react';

export const useAnswerManagement = (
  answers: { [key: number]: string },
  setAnswers: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>
) => {
  const handleAnswerChange = (questionNumber: number, answer: string) => {
    console.log(`[useAnswerManagement] Alterando resposta da questão ${questionNumber} para ${answer}`);
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: answer.toUpperCase()
    }));
  };
  
  const handleClearAnswer = (questionNumber: number) => {
    console.log(`[useAnswerManagement] Limpando resposta da questão ${questionNumber}`);
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[questionNumber];
      return newAnswers;
    });
  };

  return {
    handleAnswerChange,
    handleClearAnswer
  };
};
