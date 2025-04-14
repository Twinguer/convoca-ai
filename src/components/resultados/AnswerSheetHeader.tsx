
import React from 'react';
import { Concurso } from '@/types/concursos';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Briefcase, BookA, School, Award, GraduationCap } from 'lucide-react';

interface AnswerSheetHeaderProps {
  concurso: Concurso;
  getTotalQuestions: () => number;
}

export const AnswerSheetHeader: React.FC<AnswerSheetHeaderProps> = ({ 
  concurso, 
  getTotalQuestions 
}) => {
  const totalQuestions = getTotalQuestions();
  const examTypeLabel = concurso.exam_type === 'Certo ou Errado' 
    ? 'Certo ou Errado' 
    : `${concurso.alternatives_count || 5} Alternativas`;
  
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">{concurso.orgao}</h3>
            <p className="text-gray-600">{concurso.banca} • {examTypeLabel}</p>
          </div>
          
          <div className="flex items-center bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200">
            <GraduationCap className="h-5 w-5 mr-2 text-emerald-600" />
            <span className="font-medium">{totalQuestions} questões no total</span>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {concurso.has_basic_knowledge && (
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Conhecimentos Básicos</p>
                <p className="text-gray-500">{concurso.basic_knowledge_questions} questões</p>
              </div>
            </div>
          )}
          
          {concurso.has_specific_knowledge_1 && (
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg mr-3">
                <Briefcase className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Conhecimentos Específicos</p>
                <p className="text-gray-500">{concurso.specific_knowledge_1_questions} questões</p>
              </div>
            </div>
          )}
          
          {concurso.has_specific_knowledge_2 && (
            <div className="flex items-center">
              <div className="p-2 bg-amber-50 rounded-lg mr-3">
                <BookA className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Conhecimentos Específicos 2</p>
                <p className="text-gray-500">{concurso.specific_knowledge_2_questions} questões</p>
              </div>
            </div>
          )}
          
          {concurso.has_discursive && (
            <div className="flex items-center">
              <div className="p-2 bg-emerald-50 rounded-lg mr-3">
                <Award className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium">Discursiva / Estudo de Caso</p>
                <p className="text-gray-500">Peso: {concurso.discursive_weight || 1}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
