
import { Concurso, SectionType } from '@/types/concursos';

export const handleQuestionSectionSelection = (
  concurso: Concurso,
  setSelectedSection: (section: SectionType) => void
) => {
  // Se estamos usando conhecimentos customizáveis
  if (concurso.has_custom_knowledge) {
    // Selecionar a primeira disciplina customizada habilitada
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      for (const discipline of concurso.disciplines) {
        if (discipline.isEnabled && discipline.type) {
          setSelectedSection(discipline.type as SectionType);
          return;
        }
      }
    }
    return;
  }
  
  // Estrutura tradicional
  if (concurso.has_basic_knowledge) {
    setSelectedSection('basic');
  } else if (concurso.has_specific_knowledge_1) {
    setSelectedSection('specific1');
  } else if (concurso.has_specific_knowledge_2) {
    setSelectedSection('specific2');
  } else if (concurso.has_specific_knowledge_3) {
    setSelectedSection('specific3');
  } else if (concurso.has_discursive) {
    setSelectedSection('discursive');
  } else if (concurso.has_case_study_1) {
    setSelectedSection('case_study1');
  } else if (concurso.has_case_study_2) {
    setSelectedSection('case_study2');
  } else if (concurso.has_case_study_3) {
    setSelectedSection('case_study3');
  }
};
