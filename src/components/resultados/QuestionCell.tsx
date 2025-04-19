
import React from 'react';
import { Button } from '@/components/ui/button';
import { AnswerOption } from './AnswerOption';
import { XCircle } from 'lucide-react';

interface QuestionCellProps {
  questionNumber: number | null;
  selectedAnswer?: string;
  onAnswerChange: (questionNumber: number, answer: string) => void;
  options: string[];
  disabled?: boolean;
  examType?: 'Alternativas' | 'Certo ou Errado';
  onClearAnswer?: (questionNumber: number) => void;
  isNullified?: boolean;
  onToggleNullification?: (questionNumber: number) => void;
  isAdmin?: boolean;
}

export const QuestionCell: React.FC<QuestionCellProps> = ({ 
  questionNumber, 
  selectedAnswer, 
  onAnswerChange, 
  options,
  disabled = false,
  examType = 'Alternativas',
  onClearAnswer,
  isNullified = false,
  onToggleNullification,
  isAdmin = false
}) => {
  if (questionNumber === null) {
    return null;
  }
  
  const isCertoErrado = examType === 'Certo ou Errado';

  return (
    <div className={`flex flex-col border border-gray-200 rounded-md overflow-hidden bg-white hover:shadow-md transition-shadow ${isNullified ? 'opacity-50' : ''}`}>
      <div className="text-center font-bold text-sm bg-emerald-100 py-2 border-b border-gray-200">
        <span>Questão {questionNumber}</span>
      </div>
      <div className={`flex flex-col gap-4 p-4`}>
        <div className={`flex justify-center items-center ${isCertoErrado ? 'gap-4' : 'gap-3'}`}>
          {options.map((option) => (
            <AnswerOption
              key={option}
              option={option}
              isSelected={selectedAnswer === option}
              onClick={() => !disabled && !isNullified && onAnswerChange(questionNumber, option)}
              disabled={disabled || isNullified}
              examType={examType}
            />
          ))}
          
          {isCertoErrado && onClearAnswer && !isNullified && (
            <button
              onClick={() => onClearAnswer(questionNumber)}
              disabled={disabled || !selectedAnswer}
              className={`text-xs p-1 rounded ${!selectedAnswer || disabled 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-gray-600 bg-gray-200 hover:bg-gray-300'}`}
              title="Limpar resposta"
            >
              Limpar
            </button>
          )}
        </div>
        
        {isAdmin && onToggleNullification && (
          <Button
            variant="outline"
            size="sm"
            className={`${isNullified ? 'border-red-500 text-red-500 hover:bg-red-50' : 'border-gray-300'} w-full mt-2`}
            onClick={() => onToggleNullification(questionNumber)}
          >
            {isNullified ? 'Restaurar Questão' : 'Anular Questão'}
          </Button>
        )}
      </div>
      {isNullified && (
        <div className="bg-red-50 text-red-600 text-xs text-center py-1 border-t border-red-100">
          Questão anulada
        </div>
      )}
    </div>
  );
};
