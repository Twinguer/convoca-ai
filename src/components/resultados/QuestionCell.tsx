
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
  // Adicionando log para rastrear o tratamento de questões anuladas
  React.useEffect(() => {
    if (isNullified) {
      console.log(`[QuestionCell] Questão ${questionNumber} está anulada. Resposta atual: ${selectedAnswer || 'nenhuma'}`);
    }
  }, [isNullified, questionNumber, selectedAnswer]);

  return (
    <div className={`border rounded-md p-3 ${isNullified ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium">
          Questão {questionNumber}
          {isNullified && (
            <span className="ml-2 text-xs text-amber-600 font-normal bg-amber-50 px-1.5 py-0.5 rounded-full">
              Anulada
            </span>
          )}
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
            disabled={disabled} // Permitindo seleção mesmo em questões anuladas
            examType={examType}
          />
        ))}
      </div>
    </div>
  );
};
