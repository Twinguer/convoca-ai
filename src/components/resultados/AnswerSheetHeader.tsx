
import React from 'react';
import { HelpCircle, AlertCircle } from 'lucide-react';
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
    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
      <h3 className="text-lg font-bold mb-2">Informações da Prova</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm">
            <span className="font-medium">Total de questões:</span> {getTotalQuestions()}
          </p>
          <p className="text-sm">
            <span className="font-medium">Tipo de prova:</span> {concurso.exam_type || 'Alternativas'}
          </p>
          <p className="text-sm">
            <span className="font-medium">Órgão:</span> {concurso.orgao}
          </p>
        </div>
        <div>
          <p className="text-sm">
            <span className="font-medium">Banca:</span> {concurso.banca}
          </p>
          {concurso.wrong_answer_penalty > 0 && (
            <p className="text-sm flex items-center text-amber-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>Penalidade por erro: {concurso.wrong_answer_penalty}</span>
            </p>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex items-center text-blue-600 text-sm">
        <HelpCircle className="h-4 w-4 mr-1" />
        <p>Clique na alternativa para marcar sua resposta</p>
      </div>
    </div>
  );
};
