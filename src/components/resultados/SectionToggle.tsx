
import React from 'react';
import { Concurso, SectionType } from '@/types/concursos';
import { getDisciplines } from '@/integrations/supabase/rankings/examStructure';

interface SectionToggleProps {
  selectedSection: SectionType;
  onSectionChange: (section: SectionType) => void;
  concurso: Concurso;
}

export const SectionToggle: React.FC<SectionToggleProps> = ({
  selectedSection,
  onSectionChange,
  concurso
}) => {
  const disciplines = getDisciplines(concurso);
  
  // Filtrar apenas disciplinas habilitadas
  const enabledDisciplines = disciplines.filter(d => d.isEnabled);

  // Verificar seções subjetivas
  const hasDiscursive = concurso.has_discursive;
  const hasCaseStudy1 = concurso.has_case_study_1;
  const hasCaseStudy2 = concurso.has_case_study_2;
  const hasCaseStudy3 = concurso.has_case_study_3;

  return (
    <div className="bg-gray-100 border-b overflow-x-auto">
      <div className="flex flex-nowrap min-w-full">
        {enabledDisciplines.map((discipline) => (
          <button
            key={discipline.type}
            onClick={() => onSectionChange(discipline.type)}
            className={`py-3 px-4 font-medium text-sm transition-colors whitespace-nowrap
              ${selectedSection === discipline.type 
                ? 'bg-white border-t-2 border-emerald-600 text-emerald-700' 
                : 'text-gray-600 hover:bg-gray-200'}`}
          >
            {discipline.name} {discipline.weight && discipline.weight > 1 ? 
              `(Peso ${discipline.weight})` : ''}
          </button>
        ))}
        
        {hasDiscursive && (
          <button
            onClick={() => onSectionChange('discursive')}
            className={`py-3 px-4 font-medium text-sm transition-colors whitespace-nowrap
              ${selectedSection === 'discursive' 
                ? 'bg-white border-t-2 border-emerald-600 text-emerald-700' 
                : 'text-gray-600 hover:bg-gray-200'}`}
          >
            Discursiva
          </button>
        )}
        
        {hasCaseStudy1 && (
          <button
            onClick={() => onSectionChange('case_study1')}
            className={`py-3 px-4 font-medium text-sm transition-colors whitespace-nowrap
              ${selectedSection === 'case_study1' 
                ? 'bg-white border-t-2 border-emerald-600 text-emerald-700' 
                : 'text-gray-600 hover:bg-gray-200'}`}
          >
            Estudo de Caso 1
          </button>
        )}
        
        {hasCaseStudy2 && (
          <button
            onClick={() => onSectionChange('case_study2')}
            className={`py-3 px-4 font-medium text-sm transition-colors whitespace-nowrap
              ${selectedSection === 'case_study2' 
                ? 'bg-white border-t-2 border-emerald-600 text-emerald-700' 
                : 'text-gray-600 hover:bg-gray-200'}`}
          >
            Estudo de Caso 2
          </button>
        )}
        
        {hasCaseStudy3 && (
          <button
            onClick={() => onSectionSection('case_study3')}
            className={`py-3 px-4 font-medium text-sm transition-colors whitespace-nowrap
              ${selectedSection === 'case_study3' 
                ? 'bg-white border-t-2 border-emerald-600 text-emerald-700' 
                : 'text-gray-600 hover:bg-gray-200'}`}
          >
            Estudo de Caso 3
          </button>
        )}
      </div>
    </div>
  );
};
