
import React from 'react';
import { Concurso } from '@/types/concursos';

interface SectionToggleProps {
  selectedSection: 'basic' | 'specific1' | 'specific2' | 'specific3' | 'discursive' | 'case_study1' | 'case_study2' | 'case_study3';
  onSectionChange: (section: 'basic' | 'specific1' | 'specific2' | 'specific3' | 'discursive' | 'case_study1' | 'case_study2' | 'case_study3') => void;
  concurso: Concurso;
}

export const SectionToggle: React.FC<SectionToggleProps> = ({
  selectedSection,
  onSectionChange,
  concurso
}) => {
  // Determine which sections are enabled based on the concurso configuration
  const hasBasic = concurso.has_basic_knowledge;
  const hasSpecific1 = concurso.has_specific_knowledge_1;
  const hasSpecific2 = concurso.has_specific_knowledge_2;
  const hasSpecific3 = concurso.has_specific_knowledge_3;
  const hasDiscursive = concurso.has_discursive;
  const hasCaseStudy1 = concurso.has_case_study_1;
  const hasCaseStudy2 = concurso.has_case_study_2;
  const hasCaseStudy3 = concurso.has_case_study_3;

  return (
    <div className="bg-gray-100 border-b overflow-x-auto">
      <div className="flex flex-nowrap min-w-full">
        {hasBasic && (
          <button
            onClick={() => onSectionChange('basic')}
            className={`py-3 px-4 font-medium text-sm transition-colors whitespace-nowrap
              ${selectedSection === 'basic' 
                ? 'bg-white border-t-2 border-emerald-600 text-emerald-700' 
                : 'text-gray-600 hover:bg-gray-200'}`}
          >
            C. Básicos {concurso.basic_knowledge_weight && concurso.basic_knowledge_weight > 1 ? 
              `(Peso ${concurso.basic_knowledge_weight})` : ''}
          </button>
        )}
        
        {hasSpecific1 && (
          <button
            onClick={() => onSectionChange('specific1')}
            className={`py-3 px-4 font-medium text-sm transition-colors whitespace-nowrap
              ${selectedSection === 'specific1' 
                ? 'bg-white border-t-2 border-emerald-600 text-emerald-700' 
                : 'text-gray-600 hover:bg-gray-200'}`}
          >
            C. Específicos 1 {concurso.specific_knowledge_1_weight && concurso.specific_knowledge_1_weight > 1 ? 
              `(Peso ${concurso.specific_knowledge_1_weight})` : ''}
          </button>
        )}
        
        {hasSpecific2 && (
          <button
            onClick={() => onSectionChange('specific2')}
            className={`py-3 px-4 font-medium text-sm transition-colors whitespace-nowrap
              ${selectedSection === 'specific2' 
                ? 'bg-white border-t-2 border-emerald-600 text-emerald-700' 
                : 'text-gray-600 hover:bg-gray-200'}`}
          >
            C. Específicos 2 {concurso.specific_knowledge_2_weight && concurso.specific_knowledge_2_weight > 1 ? 
              `(Peso ${concurso.specific_knowledge_2_weight})` : ''}
          </button>
        )}
        
        {hasSpecific3 && (
          <button
            onClick={() => onSectionChange('specific3')}
            className={`py-3 px-4 font-medium text-sm transition-colors whitespace-nowrap
              ${selectedSection === 'specific3' 
                ? 'bg-white border-t-2 border-emerald-600 text-emerald-700' 
                : 'text-gray-600 hover:bg-gray-200'}`}
          >
            C. Específicos 3 {concurso.specific_knowledge_3_weight && concurso.specific_knowledge_3_weight > 1 ? 
              `(Peso ${concurso.specific_knowledge_3_weight})` : ''}
          </button>
        )}
        
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
            onClick={() => onSectionChange('case_study3')}
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
