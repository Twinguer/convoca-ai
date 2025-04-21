
import React from 'react';
import { AnswerOption } from './AnswerOption';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface QuestionCellProps {
  questionNumber: number;
  selectedAnswer: string;
  onAnswerChange: (questionNumber: number, answer: string) => void;
  options: string[];
  disabled?: boolean;
  examType?: 'Alternativas' | 'Certo ou Errado';
  onClearAnswer?: (questionNumber: number) => void;
}

export const QuestionCell: React.FC<QuestionCellProps> = ({
  questionNumber,
  selectedAnswer,
  onAnswerChange,
  options,
  disabled = false,
  examType = 'Alternativas',
  onClearAnswer
}) => {
  return (
    <div className={`p-3 border rounded-md bg-white shadow-sm ${disabled ? 'opacity-75' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium text-gray-700">Questão {questionNumber}</div>
        {onClearAnswer && selectedAnswer && !disabled && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={() => onClearAnswer(questionNumber)}
          >
            <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        {options.map((option) => (
          <AnswerOption
            key={option}
            option={option}
            isSelected={selectedAnswer === option}
            onClick={() => onAnswerChange(questionNumber, option)}
            disabled={disabled}
            examType={examType}
          />
        ))}
      </div>
    </div>
  );
};
