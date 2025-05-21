
import { Concurso, SectionType, DisciplineBlock, NestedDiscipline } from '@/types/concursos';
import { getDisciplines, isHierarchicalStructure } from '@/integrations/supabase/rankings/examStructure';

export const handleQuestionSectionSelection = (
  concurso: Concurso,
  setSelectedSection: (section: SectionType) => void
) => {
  console.log('handleQuestionSectionSelection - Selecting first available section for concurso:', concurso?.id);

  // Se estamos usando conhecimentos customizáveis
  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    // Verificar se temos estrutura hierárquica (blocos -> disciplinas)
    const hierarchical = isHierarchicalStructure(concurso);

    console.log('Using hierarchical structure:', hierarchical);

    // Processar estrutura hierárquica (blocos -> disciplinas)
    if (hierarchical) {
      for (const block of concurso.disciplines as DisciplineBlock[]) {
        console.log('Checking block:', block.name);

        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.type) {
              console.log('Selected first enabled discipline (hierarchical):', discipline.name, discipline.type);
              setSelectedSection(discipline.type as SectionType);
              return; // Sair da função assim que encontrar
            }
          }
        }
      }
    } else {
      // Estrutura plana de disciplinas
      for (const discipline of concurso.disciplines as NestedDiscipline[]) {
        if (discipline.isEnabled && discipline.type) {
          console.log('Selected first enabled discipline (flat):', discipline.name, discipline.type);
          setSelectedSection(discipline.type as SectionType);
          return; // Sair da função assim que encontrar
        }
      }
    }
  }

  // Pegar todas as disciplinas habilitadas usando a função existente
  const disciplines = getDisciplines(concurso);

  // Procurar a primeira disciplina habilitada retornada por getDisciplines
  if (Array.isArray(disciplines) && disciplines.length > 0) {
    const firstEnabledDiscipline = disciplines.find(d => d.isEnabled);
    if (firstEnabledDiscipline) {
      console.log('Selected first enabled discipline (via getDisciplines):', firstEnabledDiscipline.name, firstEnabledDiscipline.type);
      setSelectedSection(firstEnabledDiscipline.type as SectionType);
      return; // Sair da função
    }
  }

  // Fallback para estrutura tradicional
  if (concurso.has_basic_knowledge) {
    console.log('Fallback to basic knowledge section');
    setSelectedSection('basic');
  } else if (concurso.has_specific_knowledge_1) {
    console.log('Fallback to specific knowledge 1 section');
    setSelectedSection('specific1');
  } else if (concurso.has_specific_knowledge_2) {
    console.log('Fallback to specific knowledge 2 section');
    setSelectedSection('specific2');
  } else if (concurso.has_specific_knowledge_3) {
    console.log('Fallback to specific knowledge 3 section');
    setSelectedSection('specific3');
  } else if (concurso.has_discursive) {
    console.log('Fallback to discursive section');
    setSelectedSection('discursive');
  } else if (concurso.has_case_study_1) {
    console.log('Fallback to case study 1 section');
    setSelectedSection('case_study1');
  } else if (concurso.has_case_study_2) {
    console.log('Fallback to case study 2 section');
    setSelectedSection('case_study2');
  } else if (concurso.has_case_study_3) {
    console.log('Fallback to case study 3 section');
    setSelectedSection('case_study3');
  } else {
    // Último fallback para basic como padrão se nenhuma seção for encontrada
    console.log('Last fallback to basic section');
    setSelectedSection('basic');
  }
};
