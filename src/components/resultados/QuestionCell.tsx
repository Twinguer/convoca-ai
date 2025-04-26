
import React from 'react';
import { AnswerOption } from './AnswerOption';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuestionCellProps {
  questionNumber: number;
  selectedAnswer?: string;
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
  onClearAnswer,
}) => {
  return (
    <div className="border rounded-md p-3 bg-white">
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium">
          Questão {questionNumber}
        </div>
        
        {selectedAnswer && onClearAnswer && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0" 
            onClick={() => onClearAnswer(questionNumber)}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Limpar resposta</span>
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
