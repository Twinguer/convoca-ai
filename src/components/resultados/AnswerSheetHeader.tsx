
import React from 'react';
import { Concurso } from '@/types/concursos';
import { Separator } from '@/components/ui/separator';

interface AnswerSheetHeaderProps {
  concurso: Concurso;
  getTotalQuestions: () => number;
}

export const AnswerSheetHeader: React.FC<AnswerSheetHeaderProps> = ({ concurso, getTotalQuestions }) => {
  return (
    <div className="space-y-2 text-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="font-medium">Banca:</p>
          <p>{concurso.banca}</p>
        </div>
        <div>
          <p className="font-medium">Órgão:</p>
          <p>{concurso.orgao}</p>
        </div>
        <div>
          <p className="font-medium">Total de Questões:</p>
          <p>{getTotalQuestions()}</p>
        </div>
      </div>
      
      <Separator className="my-2" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {concurso.has_basic_knowledge && (
          <div>
            <p className="font-medium">Questões de Conhecimentos Básicos:</p>
            <p>{concurso.basic_knowledge_questions}</p>
          </div>
        )}
        
        {concurso.has_specific_knowledge_1 && (
          <div>
            <p className="font-medium">Questões de Conhecimentos Específicos 1:</p>
            <p>{concurso.specific_knowledge_1_questions}</p>
          </div>
        )}
        
        {concurso.has_specific_knowledge_2 && (
          <div>
            <p className="font-medium">Questões de Conhecimentos Específicos 2:</p>
            <p>{concurso.specific_knowledge_2_questions}</p>
          </div>
        )}
        
        {concurso.has_specific_knowledge_3 && (
          <div>
            <p className="font-medium">Questões de Conhecimentos Específicos 3:</p>
            <p>{concurso.specific_knowledge_3_questions}</p>
          </div>
        )}
      </div>
    </div>
  );
};
