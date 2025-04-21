
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpCircle } from 'lucide-react';

interface ExamTypeWarningProps {
  examType: 'Alternativas' | 'Certo ou Errado';
}

export const ExamTypeWarning: React.FC<ExamTypeWarningProps> = ({ examType }) => {
  return (
    <Alert className="bg-blue-50 text-blue-900 border-blue-200">
      <HelpCircle className="h-4 w-4 text-blue-600" />
      <AlertTitle>Este é um exame do tipo {examType}</AlertTitle>
      <AlertDescription>
        {examType === 'Alternativas' ? (
          <span>Selecione uma alternativa de A a E para cada questão.</span>
        ) : (
          <span>Selecione C (Certo) ou E (Errado) para cada questão.</span>
        )}
      </AlertDescription>
    </Alert>
  );
};
