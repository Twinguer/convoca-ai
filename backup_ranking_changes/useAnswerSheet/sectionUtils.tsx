
import { Concurso, SectionType } from '@/types/concursos';

export const handleQuestionSectionSelection = (
  concurso: Concurso, 
  setSelectedSection: React.Dispatch<React.SetStateAction<SectionType>>
) => {
  if (!concurso) return;
  
  // Estrutura customizada com disciplinas
  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    // Selecionar primeira disciplina habilitada
    let foundSection = false;
    
    // Checar se estrutura é hierárquica
    const isHierarchical = concurso.disciplines.length > 0 && 'disciplines' in concurso.disciplines[0];
    
    if (isHierarchical) {
      // Estrutura hierárquica (blocos -> disciplinas)
      for (const block of concurso.disciplines) {
        if ('disciplines' in block) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.type) {
              setSelectedSection(discipline.type as SectionType);
              foundSection = true;
              break;
            }
          }
          if (foundSection) break;
        }
      }
    } else {
      // Estrutura plana
      for (const discipline of concurso.disciplines) {
        if ('isEnabled' in discipline && discipline.isEnabled && discipline.type) {
          setSelectedSection(discipline.type as SectionType);
          foundSection = true;
          break;
        }
      }
    }
  } else {
    // Estrutura tradicional - selecionar primeira seção disponível
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
  }
};
