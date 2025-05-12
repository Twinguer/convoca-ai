import React from 'react';
import { AlertTriangle } from 'lucide-react';
interface ExamTypeWarningProps {
  examType: 'Alternativas' | 'Certo ou Errado';
}
export const ExamTypeWarning: React.FC<ExamTypeWarningProps> = ({
  examType
}) => {
  if (examType === 'Alternativas') {
    return;
  }
  return <div className="bg-amber-50 p-4 rounded-md border border-amber-200 flex items-start gap-2">
      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
      <p className="text-sm text-amber-800">
        <strong>Atenção:</strong> Em provas Certo ou Errado, questões em branco não recebem pontuação nem penalidade.
      </p>
    </div>;
};