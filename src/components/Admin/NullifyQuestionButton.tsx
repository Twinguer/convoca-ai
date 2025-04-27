
import React from 'react';

interface NullifyQuestionButtonProps {
  questionNumber: number;
  isNullified: boolean;
  onNullify: (questionNumber: number) => void;
}

export const NullifyQuestionButton: React.FC<NullifyQuestionButtonProps> = ({
  questionNumber,
  isNullified,
  onNullify
}) => {
  // This is just a placeholder component to prevent import errors
  return null;
};
