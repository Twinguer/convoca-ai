
import React from 'react';
import { AnswerOption } from './AnswerOption';

interface QuestionCellProps {
  questionNumber: number | null;
  selectedAnswer?: string;
  onAnswerChange: (questionNumber: number, answer: string) => void;
  options: string[];
  disabled?: boolean;
}

export const QuestionCell: React.FC<QuestionCellProps> = ({ 
  questionNumber, 
  selectedAnswer, 
  onAnswerChange, 
  options,
  disabled = false
}) => {
  if (questionNumber === null) {
    return null;
  }

  return (
    <div className="flex flex-col border border-gray-200 rounded-md overflow-hidden bg-white hover:shadow-md transition-shadow">
      <div className="text-center font-bold text-sm bg-emerald-100 py-2 border-b border-gray-200">
        Questão {questionNumber}
      </div>
      <div className="flex justify-center items-center gap-3 p-4">
        {options.map((option) => (
          <AnswerOption
            key={option}
            option={option}
            isSelected={selectedAnswer === option}
            onClick={() => !disabled && onAnswerChange(questionNumber, option)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};
