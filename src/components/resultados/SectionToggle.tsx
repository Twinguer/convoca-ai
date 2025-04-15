
import React from 'react';
import { Concurso } from '@/types/concursos';

interface SectionToggleProps {
  selectedSection: 'basic' | 'specific1' | 'specific2' | 'specific3' | 'discursive' | 'case_study';
  onSectionChange: (section: 'basic' | 'specific1' | 'specific2' | 'specific3' | 'discursive' | 'case_study') => void;
  concurso: Concurso;
}

export const SectionToggle: React.FC<SectionToggleProps> = ({
  selectedSection,
  onSectionChange,
  concurso
}) => {
  // Check if discursive or case studies are enabled
  const hasDiscursiveOrCaseStudy = 
    concurso.has_discursive || 
    concurso.has_case_study_1 || 
    concurso.has_case_study_2 ||
    concurso.has_case_study_3;

  return (
    <div className="bg-gray-100 border-b">
      <div className="flex flex-wrap">
        {concurso.has_basic_knowledge && (
          <button
            onClick={() => onSectionChange('basic')}
            className={`py-3 px-4 font-medium text-sm transition-colors
              ${selectedSection === 'basic' 
                ? 'bg-white border-t-2 border-emerald-600 text-emerald-700' 
                : 'text-gray-600 hover:bg-gray-200'}`}
          >
            Conhecimentos Básicos
          </button>
        )}
        
        {concurso.has_specific_knowledge_1 && (
          <button
            onClick={() => onSectionChange('specific1')}
            className={`py-3 px-4 font-medium text-sm transition-colors
              ${selectedSection === 'specific1' 
                ? 'bg-white border-t-2 border-emerald-600 text-emerald-700' 
                : 'text-gray-600 hover:bg-gray-200'}`}
          >
            C. Específicos 1
          </button>
        )}
        
        {concurso.has_specific_knowledge_2 && (
          <button
            onClick={() => onSectionChange('specific2')}
            className={`py-3 px-4 font-medium text-sm transition-colors
              ${selectedSection === 'specific2' 
                ? 'bg-white border-t-2 border-emerald-600 text-emerald-700' 
                : 'text-gray-600 hover:bg-gray-200'}`}
          >
            C. Específicos 2
          </button>
        )}
        
        {concurso.has_specific_knowledge_3 && (
          <button
            onClick={() => onSectionChange('specific3')}
            className={`py-3 px-4 font-medium text-sm transition-colors
              ${selectedSection === 'specific3' 
                ? 'bg-white border-t-2 border-emerald-600 text-emerald-700' 
                : 'text-gray-600 hover:bg-gray-200'}`}
          >
            C. Específicos 3
          </button>
        )}
        
        {hasDiscursiveOrCaseStudy && (
          <button
            onClick={() => onSectionChange('discursive')}
            className={`py-3 px-4 font-medium text-sm transition-colors
              ${selectedSection === 'discursive' 
                ? 'bg-white border-t-2 border-emerald-600 text-emerald-700' 
                : 'text-gray-600 hover:bg-gray-200'}`}
          >
            Discursiva / Estudo de Caso
          </button>
        )}
      </div>
    </div>
  );
};
