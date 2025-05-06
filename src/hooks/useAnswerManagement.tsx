
import React from 'react';

export const useAnswerManagement = (
  answers: { [key: number]: string },
  setAnswers: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>
) => {
  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: answer
    }));
    console.log(`Questão ${questionNumber} respondida: ${answer}`);
  };
  
  const handleClearAnswer = (questionNumber: number) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[questionNumber];
      return newAnswers;
    });
    console.log(`Resposta da questão ${questionNumber} limpa`);
  };

  return {
    handleAnswerChange,
    handleClearAnswer
  };
};
