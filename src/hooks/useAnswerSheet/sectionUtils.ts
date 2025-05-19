
import { Concurso, SectionType } from '@/types/concursos';
import { getDisciplines } from '@/integrations/supabase/rankings/examStructure';

export const handleQuestionSectionSelection = (
  concurso: Concurso,
  setSelectedSection: (section: SectionType) => void
) => {
  console.log('handleQuestionSectionSelection - Selecting first available section for concurso:', concurso?.id);
  
  // Se estamos usando conhecimentos customizáveis
  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    // Verificar se temos estrutura hierárquica (blocos -> disciplinas)
    const isHierarchical = concurso.disciplines[0] && 
                         typeof concurso.disciplines[0] === 'object' && 
                         'name' in concurso.disciplines[0] && 
                         'disciplines' in concurso.disciplines[0];
    
    console.log('Using hierarchical structure:', isHierarchical);
    
    // Processar estrutura hierárquica
    if (isHierarchical) {
      for (const block of concurso.disciplines as any[]) {
        console.log('Checking block:', block.name);
        
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.type) {
              console.log('Selected first enabled discipline:', discipline.name, discipline.type);
              setSelectedSection(discipline.type as SectionType);
              return;
            }
          }
        }
      }
    } else {
      // Estrutura plana de disciplinas
      for (const discipline of concurso.disciplines) {
        if (discipline.isEnabled && discipline.type) {
          console.log('Selected first enabled discipline (flat):', discipline.name, discipline.type);
          setSelectedSection(discipline.type as SectionType);
          return;
        }
      }
    }
  }
  
  // Pegar todas as disciplinas habilitadas usando a função existente
  const disciplines = getDisciplines(concurso);
  
  // Procurar a primeira disciplina habilitada
  if (Array.isArray(disciplines) && disciplines.length > 0) {
    const firstEnabledDiscipline = disciplines.find(d => d.isEnabled);
    if (firstEnabledDiscipline) {
      console.log('Selected first enabled discipline from getDisciplines:', firstEnabledDiscipline.name, firstEnabledDiscipline.type);
      setSelectedSection(firstEnabledDiscipline.type);
      return;
    }
  }
  
  // Fallback para estrutura tradicional
  if (concurso.has_basic_knowledge) {
    console.log('Fallback to basic knowledge section');
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
  } else {
    // Último fallback para basic como padrão
    console.log('Last fallback to basic section');
    setSelectedSection('basic');
  }
};
