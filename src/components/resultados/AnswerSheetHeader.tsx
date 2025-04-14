
import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Concurso } from '@/types/concursos';

interface AnswerSheetHeaderProps {
  concurso: Concurso;
  getTotalQuestions: () => number;
}

export const AnswerSheetHeader: React.FC<AnswerSheetHeaderProps> = ({ 
  concurso, 
  getTotalQuestions 
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
      <div>
        <p className="text-sm font-medium">
          Total de questões: <span className="font-semibold">{getTotalQuestions()}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Tipo de prova: <span className="font-semibold">{concurso.exam_type || 'Alternativas'}</span>
        </p>
      </div>
      
      <div className="flex items-center text-blue-600 text-sm">
        <HelpCircle className="h-4 w-4 mr-1" />
        <p>Clique na célula para marcar sua resposta</p>
      </div>
    </div>
  );
};
