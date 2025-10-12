
import React from 'react';
import { Concurso, SectionType } from '@/types/concursos';
import { getDisciplines, isHierarchicalStructure } from '@/integrations/supabase/rankings/examStructure';

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
    
    // Always use disciplines structure (new system)
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      console.log('[SectionToggle] Usando estrutura de disciplinas');
      const hierarchical = isHierarchicalStructure(concurso);
      
      if (hierarchical) {
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
      console.warn('[SectionToggle] No disciplines found');
    }
    
    return result;
  };
  
  const enabledDisciplines = getDisplayDisciplines();

  // Verificar seções subjetivas
  const hasDiscursive = concurso.has_discursive;
  const hasCaseStudy1 = concurso.has_case_study_1;
  const hasCaseStudy2 = concurso.has_case_study_2;
  const hasCaseStudy3 = concurso.has_case_study_3;

  // Registrar no console para depuração
  console.log('SectionToggle - enabled disciplines:', enabledDisciplines);
  console.log('SectionToggle - selected section:', selectedSection);

  return (
    <div className="bg-muted/30 border-b border-border overflow-x-auto">
      <div className="flex flex-nowrap min-w-full">
        {enabledDisciplines.map((discipline) => (
          <button
            key={discipline.type}
            onClick={() => onSectionChange(discipline.type)}
            className={`py-3 px-4 font-medium text-sm transition-colors whitespace-nowrap
              ${selectedSection === discipline.type 
                ? 'bg-card border-t-2 border-primary text-primary' 
                : 'text-muted-foreground hover:bg-muted/20'}`}
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
                ? 'bg-card border-t-2 border-primary text-primary' 
                : 'text-muted-foreground hover:bg-muted/20'}`}
          >
            Discursiva
          </button>
        )}
        
        {hasCaseStudy1 && (
          <button
            onClick={() => onSectionChange('case_study1')}
            className={`py-3 px-4 font-medium text-sm transition-colors whitespace-nowrap
              ${selectedSection === 'case_study1' 
                ? 'bg-card border-t-2 border-primary text-primary' 
                : 'text-muted-foreground hover:bg-muted/20'}`}
          >
            Estudo de Caso 1
          </button>
        )}
        
        {hasCaseStudy2 && (
          <button
            onClick={() => onSectionChange('case_study2')}
            className={`py-3 px-4 font-medium text-sm transition-colors whitespace-nowrap
              ${selectedSection === 'case_study2' 
                ? 'bg-card border-t-2 border-primary text-primary' 
                : 'text-muted-foreground hover:bg-muted/20'}`}
          >
            Estudo de Caso 2
          </button>
        )}
        
        {hasCaseStudy3 && (
          <button
            onClick={() => onSectionChange('case_study3')}
            className={`py-3 px-4 font-medium text-sm transition-colors whitespace-nowrap
              ${selectedSection === 'case_study3' 
                ? 'bg-card border-t-2 border-primary text-primary' 
                : 'text-muted-foreground hover:bg-muted/20'}`}
          >
            Estudo de Caso 3
          </button>
        )}
      </div>
    </div>
  );
};
