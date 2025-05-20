
import { Concurso, SectionType } from '@/types/concursos';
import { getDisciplines, isHierarchicalStructure } from '@/integrations/supabase/rankings/examStructure';

export const handleQuestionSectionSelection = (
  concurso: Concurso,
  setSelectedSection: (section: SectionType) => void
) => {
  // Check if using hierarchical structure
  if (isHierarchicalStructure(concurso)) {
    if (concurso.discipline_blocks && Array.isArray(concurso.discipline_blocks)) {
      // Find first enabled discipline in first block
      for (const block of concurso.discipline_blocks) {
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.type) {
              const sectionType = discipline.type as SectionType;
              setSelectedSection(sectionType);
              console.log(`Selected hierarchical discipline section: ${sectionType} from block: ${block.name}`);
              return;
            }
          }
        }
      }
    }
  }
  
  // If not hierarchical or no enabled disciplines found in blocks, try regular disciplines
  const disciplines = getDisciplines(concurso);
  
  if (Array.isArray(disciplines) && disciplines.length > 0) {
    const firstEnabledDiscipline = disciplines.find(d => d.isEnabled);
    if (firstEnabledDiscipline) {
      setSelectedSection(firstEnabledDiscipline.type);
      return;
    }
  }
  
  // Verificar partes subjetivas
  if (concurso.has_discursive) {
    setSelectedSection('discursive');
  } else if (concurso.has_case_study_1) {
    setSelectedSection('case_study1');
  } else if (concurso.has_case_study_2) {
    setSelectedSection('case_study2');
  } else if (concurso.has_case_study_3) {
    setSelectedSection('case_study3');
  } else {
    // Fallback para basic como padrão
    setSelectedSection('basic');
  }
};
