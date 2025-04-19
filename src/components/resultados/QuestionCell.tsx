
import React from 'react';
import { AnswerOption } from './AnswerOption';

interface QuestionCellProps {
  questionNumber: number;
  selectedAnswer?: string;
  onAnswerChange: (questionNumber: number, answer: string) => void;
  options: string[];
  disabled?: boolean;
  examType?: 'Alternativas' | 'Certo ou Errado';
  onClearAnswer?: (questionNumber: number) => void;
  isNullified?: boolean;
}

export const QuestionCell: React.FC<QuestionCellProps> = ({
  questionNumber,
  selectedAnswer,
  onAnswerChange,
  options,
  disabled = false,
  examType = 'Alternativas',
  onClearAnswer,
  isNullified = false
}) => {
  return (
    <div className={`border rounded-md p-3 overflow-hidden ${isNullified ? 'bg-gray-100' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className={`font-medium ${isNullified ? 'text-gray-500' : 'text-gray-700'}`}>
          Questão {questionNumber}
          {isNullified && <span className="ml-2 text-sm italic text-gray-500">(Anulada)</span>}
        </h3>
        
        {onClearAnswer && selectedAnswer && !isNullified && (
          <button 
            onClick={() => onClearAnswer(questionNumber)} 
            className="text-xs text-gray-500 hover:text-gray-700"
            disabled={disabled}
          >
            Limpar
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <AnswerOption
            key={option}
            option={option}
            isSelected={selectedAnswer === option}
            onClick={() => onAnswerChange(questionNumber, option)}
            disabled={disabled || isNullified}
            examType={examType}
          />
        ))}
      </div>
    </div>
  );
};
