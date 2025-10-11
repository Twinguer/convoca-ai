
import { Concurso, SectionType, DisciplineBlock, NestedDiscipline } from '@/types/concursos';
import { getDisciplines, isHierarchicalStructure } from '@/integrations/supabase/rankings/examStructure';

export const handleQuestionSectionSelection = (
  concurso: Concurso,
  setSelectedSection: (section: SectionType) => void
) => {
  // Log removido por segurança

  // Se estamos usando conhecimentos customizáveis
  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    // Verificar se temos estrutura hierárquica (blocos -> disciplinas)
    const hierarchical = isHierarchicalStructure(concurso);

    // Log removido por segurança

    // Processar estrutura hierárquica (blocos -> disciplinas)
    if (hierarchical) {
      for (const item of concurso.disciplines) {
        // TypeGuard para verificar se é um bloco
        if ('disciplines' in item && Array.isArray(item.disciplines)) {
          // Log removido por segurança
          const block = item as DisciplineBlock;

          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.type) {
              // Log removido por segurança
              setSelectedSection(discipline.type as SectionType);
              return; // Sair da função assim que encontrar
            }
          }
        }
      }
    } else {
      // Estrutura plana de disciplinas
      for (const item of concurso.disciplines) {
        // TypeGuard para verificar se é uma disciplina
        if ('isEnabled' in item && item.isEnabled && item.type) {
          const discipline = item as NestedDiscipline;
          // Log removido por segurança
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
      // Log removido por segurança
      setSelectedSection(firstEnabledDiscipline.type as SectionType);
      return; // Sair da função
    }
  }

  // Fallback para estrutura tradicional
  if (concurso.has_basic_knowledge) {
    // Log removido por segurança
    setSelectedSection('basic');
  } else if (concurso.has_specific_knowledge_1) {
    // Log removido por segurança
    setSelectedSection('specific1');
  } else if (concurso.has_specific_knowledge_2) {
    // Log removido por segurança
    setSelectedSection('specific2');
  } else if (concurso.has_specific_knowledge_3) {
    // Log removido por segurança
    setSelectedSection('specific3');
  } else if (concurso.has_discursive) {
    // Log removido por segurança
    setSelectedSection('discursive');
  } else if (concurso.has_case_study_1) {
    // Log removido por segurança
    setSelectedSection('case_study1');
  } else if (concurso.has_case_study_2) {
    // Log removido por segurança
    setSelectedSection('case_study2');
  } else if (concurso.has_case_study_3) {
    // Log removido por segurança
    setSelectedSection('case_study3');
  } else {
    // Último fallback para basic como padrão se nenhuma seção for encontrada
    // Log removido por segurança
    setSelectedSection('basic');
  }
};
