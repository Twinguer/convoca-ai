
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
    <div className={`border p-3 rounded-lg shadow-sm bg-white ${isNullified ? 'opacity-75 bg-gray-100' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <Label className="font-medium">Questão {questionNumber}</Label>
        {onClearAnswer && !disabled && selectedAnswer && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onClearAnswer(questionNumber)}
            className="h-6 px-2 text-xs"
          >
            Limpar
          </Button>
        )}
      </div>

      {isNullified && (
        <div className="text-xs text-red-500 mb-2 font-semibold">
          Questão anulada
        </div>
      )}

      <RadioGroup
        value={selectedAnswer || ''}
        onValueChange={(value) => onAnswerChange(questionNumber, value)}
        className="flex flex-wrap gap-2"
        disabled={disabled}
      >
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-1">
            <RadioGroupItem
              value={option}
              id={`q${questionNumber}-${option}`}
            />
            <Label htmlFor={`q${questionNumber}-${option}`} className="text-sm">
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
