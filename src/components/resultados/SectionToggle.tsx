
import React from 'react';
import { Concurso } from '@/types/concursos';

interface SectionToggleProps {
  selectedSection: 'basic' | 'specific1' | 'specific2';
  onSectionChange: (section: 'basic' | 'specific1' | 'specific2') => void;
  concurso: Concurso;
}

export const SectionToggle: React.FC<SectionToggleProps> = ({
  selectedSection,
  onSectionChange,
  concurso
}) => {
  const hasBasic = concurso.has_basic_knowledge;
  const hasSpecific1 = concurso.has_specific_knowledge_1;
  const hasSpecific2 = concurso.has_specific_knowledge_2;
  
  // Determine number of active sections to set correct grid layout
  const activeSections = [hasBasic, hasSpecific1, hasSpecific2].filter(Boolean).length;
  const gridColsClass = activeSections === 1 ? 'grid-cols-1' : 
                        activeSections === 2 ? 'grid-cols-2' : 
                        'grid-cols-3';
  
  return (
    <div className={`bg-white border-b divide-x divide-gray-200 grid ${gridColsClass}`}>
      {hasBasic && (
        <button 
          type="button" 
          className={`py-3 px-3 text-sm md:text-base font-medium transition-colors flex items-center justify-center gap-2 ${
            selectedSection === 'basic' 
              ? 'bg-emerald-100 text-emerald-800 border-b-2 border-emerald-600' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
          }`} 
          onClick={() => onSectionChange('basic')}
        >
          <span className="hidden sm:inline">Conhecimentos Básicos</span>
          <span className="inline sm:hidden">Básicos</span>
        </button>
      )}
      
      {hasSpecific1 && (
        <button 
          type="button" 
          className={`py-3 px-3 text-sm md:text-base font-medium transition-colors flex items-center justify-center gap-2 ${
            selectedSection === 'specific1' 
              ? 'bg-emerald-100 text-emerald-800 border-b-2 border-emerald-600' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
          }`} 
          onClick={() => onSectionChange('specific1')}
        >
          <span className="hidden sm:inline">Conhecimentos Específicos</span>
          <span className="inline sm:hidden">Específicos</span>
        </button>
      )}
      
      {hasSpecific2 && (
        <button 
          type="button" 
          className={`py-3 px-3 text-sm md:text-base font-medium transition-colors flex items-center justify-center gap-2 ${
            selectedSection === 'specific2' 
              ? 'bg-emerald-100 text-emerald-800 border-b-2 border-emerald-600' 
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
          }`} 
          onClick={() => onSectionChange('specific2')}
        >
          <span className="hidden sm:inline">Conhecimentos Específicos 2</span>
          <span className="inline sm:hidden">Específicos 2</span>
        </button>
      )}
    </div>
  );
};
