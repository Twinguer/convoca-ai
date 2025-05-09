
import { Concurso } from '@/types/concursos';
import { SectionType, sectionDisplayNames, updateSectionDisplayNames } from '@/integrations/supabase/rankings/examStructure';

export const handleQuestionSectionSelection = (
  concurso: Concurso,
  setSelectedSection: (section: string) => void
) => {
  // Verificar seções padrão
  if (concurso.has_basic_knowledge) {
    setSelectedSection('basic');
    return;
  } else if (concurso.has_specific_knowledge_1) {
    setSelectedSection('specific1');
    return;
  } else if (concurso.has_specific_knowledge_2) {
    setSelectedSection('specific2');
    return;
  } else if (concurso.has_specific_knowledge_3) {
    setSelectedSection('specific3');
    return;
  } else if (concurso.has_discursive) {
    setSelectedSection('discursive');
    return;
  }

  // Verificar disciplinas customizadas
  if (concurso.disciplines && Array.isArray(concurso.disciplines) && concurso.disciplines.length > 0) {
    for (const discipline of concurso.disciplines) {
      if (discipline.isEnabled) {
        setSelectedSection(discipline.type);
        return;
      }
    }
  }

  // Caso não encontre nenhuma seção disponível
  setSelectedSection('basic');
};
