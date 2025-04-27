
import React from 'react';
import { Button } from '@/components/ui/button';
import { Ban } from 'lucide-react';

interface NullifyQuestionButtonProps {
  questionNumber: number;
  isNullified: boolean;
  onNullify: (questionNumber: number) => void;
  disabled?: boolean;
}

export const NullifyQuestionButton = ({
  questionNumber,
  isNullified,
  onNullify,
  disabled = false
}: NullifyQuestionButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onNullify(questionNumber)}
      disabled={disabled}
      className={`mt-2 w-full gap-2 ${
        isNullified 
          ? 'bg-gray-100 text-gray-500' 
          : 'hover:bg-red-50 hover:text-red-600'
      }`}
    >
      <Ban className="h-4 w-4" />
      {isNullified ? 'Questão Anulada' : 'Anular Questão'}
    </Button>
  );
};
