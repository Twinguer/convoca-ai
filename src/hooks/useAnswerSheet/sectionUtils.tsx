
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
          const sectionType = discipline.type as SectionType;
          setSelectedSection(sectionType);
          console.log(`Selected custom discipline section: ${sectionType}`);
          return;
        }
      }
    }
    
    console.log("No enabled custom disciplines found, defaulting to first section");
    return;
  }
  
  // Estrutura tradicional
  if (concurso.has_basic_knowledge) {
    setSelectedSection('basic');
    console.log("Selected traditional section: basic");
  } else if (concurso.has_specific_knowledge_1) {
    setSelectedSection('specific1');
    console.log("Selected traditional section: specific1");
  } else if (concurso.has_specific_knowledge_2) {
    setSelectedSection('specific2');
    console.log("Selected traditional section: specific2");
  } else if (concurso.has_specific_knowledge_3) {
    setSelectedSection('specific3');
    console.log("Selected traditional section: specific3");
  } else if (concurso.has_discursive) {
    setSelectedSection('discursive');
    console.log("Selected traditional section: discursive");
  } else if (concurso.has_case_study_1) {
    setSelectedSection('case_study1');
    console.log("Selected traditional section: case_study1");
  } else if (concurso.has_case_study_2) {
    setSelectedSection('case_study2');
    console.log("Selected traditional section: case_study2");
  } else if (concurso.has_case_study_3) {
    setSelectedSection('case_study3');
    console.log("Selected traditional section: case_study3");
  }
};
