
import React from 'react';
import { AnswerOption } from './AnswerOption';

interface QuestionCellProps {
  questionNumber: number | null;
  selectedAnswer?: string;
  onAnswerChange: (questionNumber: number, answer: string) => void;
  options: string[];
}

export const QuestionCell: React.FC<QuestionCellProps> = ({ 
  questionNumber, 
  selectedAnswer, 
  onAnswerChange, 
  options 
}) => {
  if (questionNumber === null) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="text-center font-medium text-sm bg-blue-100 py-1">
        {questionNumber}
      </div>
      <div className="grid grid-cols-5 gap-1 p-2">
        {options.map((option) => (
          <AnswerOption
            key={option}
            option={option}
            isSelected={selectedAnswer === option}
            onClick={() => onAnswerChange(questionNumber, option)}
          />
        ))}
      </div>
    </div>
  );
};
