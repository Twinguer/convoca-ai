import React from 'react';
import { Concurso } from '@/types/concursos';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Briefcase, BookA, School, Award, GraduationCap, Scale } from 'lucide-react';
interface AnswerSheetHeaderProps {
  concurso: Concurso;
  getTotalQuestions: () => number;
}
export const AnswerSheetHeader: React.FC<AnswerSheetHeaderProps> = ({
  concurso,
  getTotalQuestions
}) => {
  const totalQuestions = getTotalQuestions();
  const examTypeLabel = concurso.exam_type === 'Certo ou Errado' ? 'Certo ou Errado' : `${concurso.alternatives_count || 5} Alternativas`;
  return <div className="space-y-4">
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
        
        
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {concurso.has_basic_knowledge && <div className="flex items-start">
              <div>
                <p className="font-medium flex items-center">
                  Conhecimentos Básicos
                  {concurso.basic_knowledge_weight > 0 && <span className="ml-2 flex items-center text-emerald-700 font-medium">
                      <Scale className="h-3.5 w-3.5 mr-1" />
                      Peso {concurso.basic_knowledge_weight}
                    </span>}
                </p>
                <div className="flex items-center text-gray-500">
                  <p>{concurso.basic_knowledge_questions} questões</p>
                </div>
              </div>
            </div>}
          
          {concurso.has_specific_knowledge_1 && <div className="flex items-start">
              <div>
                <p className="font-medium flex items-center">
                  Conhecimentos Específicos 1
                  {concurso.specific_knowledge_1_weight > 0 && <span className="ml-2 flex items-center text-emerald-700 font-medium">
                      <Scale className="h-3.5 w-3.5 mr-1" />
                      Peso {concurso.specific_knowledge_1_weight}
                    </span>}
                </p>
                <div className="flex items-center text-gray-500">
                  <p>{concurso.specific_knowledge_1_questions} questões</p>
                </div>
              </div>
            </div>}
          
          {concurso.has_specific_knowledge_2 && <div className="flex items-start">
              <div>
                <p className="font-medium flex items-center">
                  Conhecimentos Específicos 2
                  {concurso.specific_knowledge_2_weight > 0 && <span className="ml-2 flex items-center text-emerald-700 font-medium">
                      <Scale className="h-3.5 w-3.5 mr-1" />
                      Peso {concurso.specific_knowledge_2_weight}
                    </span>}
                </p>
                <div className="flex items-center text-gray-500">
                  <p>{concurso.specific_knowledge_2_questions} questões</p>
                </div>
              </div>
            </div>}
          
          {concurso.has_specific_knowledge_3 && <div className="flex items-start">
              <div>
                <p className="font-medium flex items-center">
                  Conhecimentos Específicos 3
                  {concurso.specific_knowledge_3_weight > 0 && <span className="ml-2 flex items-center text-emerald-700 font-medium">
                      <Scale className="h-3.5 w-3.5 mr-1" />
                      Peso {concurso.specific_knowledge_3_weight}
                    </span>}
                </p>
                <div className="flex items-center text-gray-500">
                  <p>{concurso.specific_knowledge_3_questions} questões</p>
                </div>
              </div>
            </div>}
          
          {concurso.has_discursive}
          
          {concurso.has_case_study_1 && <div className="flex items-start">
              <div>
                <p className="font-medium flex items-center">
                  Estudo de Caso 1
                  {concurso.case_study_1_weight > 0 && <span className="ml-2 flex items-center text-emerald-700 font-medium">
                      <Scale className="h-3.5 w-3.5 mr-1" />
                      Peso {concurso.case_study_1_weight}
                    </span>}
                </p>
                <p className="text-gray-500">Nota de 0 a 100</p>
              </div>
            </div>}
          
          {concurso.has_case_study_2 && <div className="flex items-start">
              <div>
                <p className="font-medium flex items-center">
                  Estudo de Caso 2
                  {concurso.case_study_2_weight > 0 && <span className="ml-2 flex items-center text-emerald-700 font-medium">
                      <Scale className="h-3.5 w-3.5 mr-1" />
                      Peso {concurso.case_study_2_weight}
                    </span>}
                </p>
                <p className="text-gray-500">Nota de 0 a 100</p>
              </div>
            </div>}
          
          {concurso.has_case_study_3 && <div className="flex items-start">
              <div>
                <p className="font-medium flex items-center">
                  Estudo de Caso 3
                  {concurso.case_study_3_weight > 0 && <span className="ml-2 flex items-center text-emerald-700 font-medium">
                      <Scale className="h-3.5 w-3.5 mr-1" />
                      Peso {concurso.case_study_3_weight}
                    </span>}
                </p>
                <p className="text-gray-500">Nota de 0 a 100</p>
              </div>
            </div>}
        </div>
      </div>
    </div>;
};