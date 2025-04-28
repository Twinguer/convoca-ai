
import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NullifyQuestionButtonProps {
  questionNumber: number;
  isNullified: boolean;
  onNullify: (questionNumber: number) => void;
}

export const NullifyQuestionButton: React.FC<NullifyQuestionButtonProps> = ({
  questionNumber,
  isNullified,
  onNullify
}) => {
  const handleToggleNullify = () => {
    // Show toast notification before nullifying
    if (!isNullified) {
      toast.info(`Anulando questão ${questionNumber}. Isso recalculará as pontuações de todos os participantes.`, {
        duration: 3000
      });
    } else {
      toast.info(`Reativando questão ${questionNumber}. Isso recalculará as pontuações de todos os participantes.`, {
        duration: 3000
      });
    }
    
    // Call the onNullify handler
    onNullify(questionNumber);
  };
  
  return (
    <Button
      type="button"
      variant={isNullified ? "destructive" : "outline"}
      size="sm"
      onClick={handleToggleNullify}
      className={isNullified ? "border-red-300" : ""}
    >
      {isNullified ? "Anulada" : "Anular"}
    </Button>
  );
};
