
import React from 'react';
import { Button } from '@/components/ui/button';
import { Ban } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface NullifyQuestionButtonProps {
  questionNumber: number;
  isNullified: boolean;
  toggleNullified: (questionNumber: number) => void;
}

export const NullifyQuestionButton = ({
  questionNumber,
  isNullified,
  toggleNullified
}: NullifyQuestionButtonProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isNullified ? "destructive" : "outline"}
            size="sm"
            onClick={() => toggleNullified(questionNumber)}
            className="h-8 w-8 p-0"
          >
            <Ban className={`h-4 w-4 ${isNullified ? 'text-white' : 'text-muted-foreground'}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isNullified ? 'Remover anulação' : 'Anular questão'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
