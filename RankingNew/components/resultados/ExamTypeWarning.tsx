import React from 'react';
import { AlertTriangle } from 'lucide-react';
interface ExamTypeWarningProps {
  examType: 'Alternativas' | 'Certo ou Errado';
}
export const ExamTypeWarning: React.FC<ExamTypeWarningProps> = ({
  examType
}) => {
  if (examType === 'Alternativas') {
    return null;
  }
  
  return (
    <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <p className="text-sm text-foreground">
          <strong>Atenção:</strong> Esta prova é do tipo <strong>{examType}</strong>
        </p>
      </div>
    </div>
  );
};