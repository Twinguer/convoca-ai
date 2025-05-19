
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
  // Função para obter disciplinas considerando a estrutura hierárquica
  const getDisplayDisciplines = () => {
    if (!concurso) return [];
    
    const result: {type: string, name: string, weight?: number}[] = [];
    
    // Verificar se estamos usando a estrutura hierárquica (blocos -> disciplinas)
    if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
      const isHierarchical = concurso.disciplines[0] && 
                           typeof concurso.disciplines[0] === 'object' && 
                           'name' in concurso.disciplines[0] && 
                           'disciplines' in concurso.disciplines[0];
      
      if (isHierarchical) {
        // Processar estrutura hierárquica
        for (const block of concurso.disciplines as any[]) {
          if (block.disciplines && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled) {
                result.push({
                  type: discipline.type,
                  name: `${block.name} - ${discipline.name}`,
                  weight: discipline.weight
                });
              }
            }
          }
        }
      } else {
        // Usar a função original getDisciplines para estrutura plana
        return getDisciplines(concurso).filter(d => d.isEnabled);
      }
    } else {
      // Estrutura tradicional
      if (concurso.has_basic_knowledge) {
        result.push({
          type: 'basic',
          name: 'Conhecimentos Básicos',
          weight: concurso.basic_knowledge_weight
        });
      }
      
      if (concurso.has_specific_knowledge_1) {
        result.push({
          type: 'specific1',
          name: 'Conhecimentos Específicos 1',
          weight: concurso.specific_knowledge_1_weight
        });
      }
      
      if (concurso.has_specific_knowledge_2) {
        result.push({
          type: 'specific2',
          name: 'Conhecimentos Específicos 2',
          weight: concurso.specific_knowledge_2_weight
        });
      }
      
      if (concurso.has_specific_knowledge_3) {
        result.push({
          type: 'specific3',
          name: 'Conhecimentos Específicos 3',
          weight: concurso.specific_knowledge_3_weight
        });
      }
    }
    
    return result;
  };
  
  const enabledDisciplines = getDisplayDisciplines();

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
