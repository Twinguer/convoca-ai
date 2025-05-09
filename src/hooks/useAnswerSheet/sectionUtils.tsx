
import { Concurso } from '@/types/concursos';
import { SectionType } from '@/integrations/supabase/rankings/examStructure';

export const handleQuestionSectionSelection = (concurso: Concurso, setSectionCallback: (section: SectionType) => void) => {
  // Prioridade de seleção de seção
  if (concurso.has_basic_knowledge) {
    setSectionCallback('basic');
  } else if (concurso.has_specific_knowledge_1) {
    setSectionCallback('specific1');
  } else if (concurso.has_specific_knowledge_2) {
    setSectionCallback('specific2');
  } else if (concurso.has_specific_knowledge_3) {
    setSectionCallback('specific3');
  } else {
    // Verificar se há disciplinas customizadas
    if (concurso.disciplines && Array.isArray(concurso.disciplines) && concurso.disciplines.length > 0) {
      const firstCustomDiscipline = concurso.disciplines.find(d => d.isEnabled);
      if (firstCustomDiscipline) {
        setSectionCallback(firstCustomDiscipline.type as SectionType);
        return;
      }
    }
    
    // Default fallback
    setSectionCallback('basic');
  }
};

/**
 * Obtém uma array com todas as seções (standard e customizadas) ativas no concurso
 */
export const getAllEnabledSections = (concurso: Concurso): SectionType[] => {
  const enabledSections: SectionType[] = [];
  
  // Adicionar seções padrão se estiverem ativas
  if (concurso.has_basic_knowledge) enabledSections.push('basic');
  if (concurso.has_specific_knowledge_1) enabledSections.push('specific1');
  if (concurso.has_specific_knowledge_2) enabledSections.push('specific2');
  if (concurso.has_specific_knowledge_3) enabledSections.push('specific3');
  
  // Adicionar seções customizadas
  if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
    concurso.disciplines.forEach(discipline => {
      if (discipline.isEnabled && discipline.type) {
        enabledSections.push(discipline.type as SectionType);
      }
    });
  }
  
  return enabledSections;
};

/**
 * Verifica se uma string representa um tipo de seção válido
 */
export const isValidSectionType = (sectionType: string): boolean => {
  const standardSections = ['basic', 'specific1', 'specific2', 'specific3', 'discursive', 'case_study1', 'case_study2', 'case_study3'];
  
  // Se for uma seção padrão, retorna true
  if (standardSections.includes(sectionType)) {
    return true;
  }
  
  // Se não for uma seção padrão, assume que é uma seção customizada e que é válida
  return true;
};

/**
 * Obtém o nome de exibição para uma seção
 */
export const getSectionDisplayName = (sectionType: SectionType, concurso: Concurso): string => {
  // Seções padrão
  switch (sectionType) {
    case 'basic': return 'Conhecimentos Básicos';
    case 'specific1': return 'Conhecimentos Específicos';
    case 'specific2': return 'Conhecimentos Específicos 2';
    case 'specific3': return 'Conhecimentos Específicos 3';
    case 'discursive': return 'Dissertativa';
    case 'case_study1': return 'Estudo de Caso';
    case 'case_study2': return 'Estudo de Caso 2';
    case 'case_study3': return 'Estudo de Caso 3';
  }
  
  // Buscar nas disciplinas customizadas
  if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
    const discipline = concurso.disciplines.find(d => d.type === sectionType);
    if (discipline) {
      return discipline.name;
    }
  }
  
  // Fallback para a própria sectionType se não for encontrado
  return sectionType;
};
