
import React from 'react';
import { HelpCircle, AlertCircle, Info } from 'lucide-react';
import { Concurso } from '@/types/concursos';
import { Separator } from '@/components/ui/separator';

interface AnswerSheetHeaderProps {
  concurso: Concurso;
  getTotalQuestions: () => number;
}

export const AnswerSheetHeader: React.FC<AnswerSheetHeaderProps> = ({ 
  concurso, 
  getTotalQuestions 
}) => {
  return (
    <div className="bg-white p-4 rounded-md border border-gray-200">
      <h3 className="text-lg font-bold mb-2">Cartão de Respostas</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Prova:</span> {concurso.titulo}
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium">Total de questões:</span> {getTotalQuestions()}
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium">Tipo de prova:</span> {concurso.exam_type || 'Alternativas'}
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium">Órgão:</span> {concurso.orgao}
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium">Banca:</span> {concurso.banca}
          </div>
          {concurso.wrong_answer_penalty > 0 && (
            <div className="flex items-center gap-1 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span>Penalidade por erro: {concurso.wrong_answer_penalty}</span>
            </div>
          )}
        </div>
      </div>
      
      <Separator className="my-3" />
      
      <div className="flex items-center text-blue-600 text-sm bg-blue-50 p-2 rounded">
        <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0" />
        <p>Marque suas respostas clicando nas alternativas. Você pode trocar de seção para ver todas as questões da prova.</p>
      </div>
    </div>
  );
};
