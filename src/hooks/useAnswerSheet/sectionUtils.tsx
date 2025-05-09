
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
