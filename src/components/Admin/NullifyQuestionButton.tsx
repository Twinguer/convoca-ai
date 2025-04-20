
import React from 'react';
import { Button } from '@/components/ui/button';
import { Ban, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => onNullify(questionNumber)}
            variant="ghost"
            size="sm"
            className={`mt-1 w-full ${isNullified ? 'text-red-500' : 'text-gray-500'}`}
          >
            {isNullified ? (
              <div className="flex items-center gap-1">
                <Ban className="h-4 w-4" />
                <span className="text-xs">Reativar Questão</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Ban className="h-4 w-4" />
                <span className="text-xs">Anular Questão</span>
              </div>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isNullified 
            ? 'Reativar esta questão' 
            : 'Anular esta questão (não será considerada na pontuação)'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
