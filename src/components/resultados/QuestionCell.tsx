
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
    <div className="flex flex-col border border-gray-200 rounded-md overflow-hidden">
      <div className="text-center font-medium text-sm bg-blue-100 py-2 border-b border-gray-200">
        Questão {questionNumber}
      </div>
      <div className="flex justify-center items-center gap-2 p-3">
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
