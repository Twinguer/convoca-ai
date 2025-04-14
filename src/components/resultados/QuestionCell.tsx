
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
    return <div className="p-2 h-full bg-gray-50"></div>;
  }

  return (
    <div className="p-2">
      <div className="text-center font-medium text-sm bg-blue-100 py-1 rounded-t-md">
        {questionNumber}
      </div>
      <div className="grid grid-cols-5 gap-1 pt-1">
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
