
import React, { useState } from 'react';

export const useAnswerManagement = (
  answers: { [key: number]: string }, 
  setAnswers: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>
) => {
  // Função para atualizar a resposta de uma questão
  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setAnswers(prev => {
      // Se a nova resposta é a mesma já selecionada, não faz nada
      if (prev[questionNumber] === answer) return prev;
      
      // Caso contrário, atualiza a resposta para a questão
      return {
        ...prev,
        [questionNumber]: answer
      };
    });
  };
  
  // Função para limpar a resposta de uma questão
  const handleClearAnswer = (questionNumber: number) => {
    setAnswers(prev => {
      // Cria um novo objeto excluindo a entrada para a questão especificada
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
