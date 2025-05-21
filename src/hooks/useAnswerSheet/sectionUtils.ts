import { Concurso, SectionType } from '@/types/concursos';
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

    // Processar estrutura hierárquica (este bloco estava correto na iteração)
    if (hierarchical) {
      for (const block of concurso.disciplines as any[]) { // Manter as any[] por enquanto para compatibilidade com dados
        console.log('Checking block:', block.name);

        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.type) {
              console.log('Selected first enabled discipline (hierarchical):', discipline.name, discipline.type); // Log ajustado
              setSelectedSection(discipline.type as SectionType);
              return; // Sair da função assim que encontrar
            }
          }
        }
      }
    } else {
      // Estrutura plana de disciplinas (ajustado para iterar sobre blocos e disciplinas aninhadas)
      // Como a tipagem agora é sempre aninhada para has_custom_knowledge,
      // precisamos iterar sobre blocos e disciplinas mesmo no "modo antigo"
      for (const block of concurso.disciplines as any[]) { // Manter as any[] por enquanto
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.type) {
              console.log('Selected first enabled discipline (flat, adjusted):', discipline.name, discipline.type); // Log ajustado
              setSelectedSection(discipline.type as SectionType);
              return; // Sair da função assim que encontrar
            }
          }
        }
      }
    }
  }

  // Pegar todas as disciplinas habilitadas usando a função existente (assume que getDisciplines lida com a nova estrutura)
  const disciplines = getDisciplines(concurso);

  // Procurar a primeira disciplina habilitada retornada por getDisciplines
  if (Array.isArray(disciplines) && disciplines.length > 0) {
    const firstEnabledDiscipline = disciplines.find(d => d.isEnabled);
    if (firstEnabledDiscipline) {
      console.log('Selected first enabled discipline (via getDisciplines):', firstEnabledDiscipline.name, firstEnabledDiscipline.type);
      setSelectedSection(firstEnabledDiscipline.type as SectionType); // Adicionado asserção de tipo
      return; // Sair da função
    }
  }

  // Fallback para estrutura tradicional (se has_custom_knowledge for false ou nenhuma disciplina habilitada encontrada)
  // Esta parte parece lidar com concursos que não usam o sistema de conhecimento customizável.
  // Assume que concurso terá as propriedades has_basic_knowledge, has_specific_knowledge_1, etc.
  if (concurso.has_basic_knowledge) {
    console.log('Fallback to basic knowledge section');
    setSelectedSection('basic');
  } else if (concurso.has_specific_knowledge_1) {
    console.log('Fallback to specific knowledge 1 section'); // Log adicionado
    setSelectedSection('specific1');
  } else if (concurso.has_specific_knowledge_2) {
    console.log('Fallback to specific knowledge 2 section'); // Log adicionado
    setSelectedSection('specific2');
  } else if (concurso.has_specific_knowledge_3) {
    console.log('Fallback to specific knowledge 3 section'); // Log adicionado
    setSelectedSection('specific3');
  } else if (concurso.has_discursive) {
    console.log('Fallback to discursive section'); // Log adicionado
    setSelectedSection('discursive');
  } else if (concurso.has_case_study_1) {
    console.log('Fallback to case study 1 section'); // Log adicionado
    setSelectedSection('case_study1');
  } else if (concurso.has_case_study_2) {
    console.log('Fallback to case study 2 section'); // Log adicionado
    setSelectedSection('case_study2');
  } else if (concurso.has_case_study_3) {
    console.log('Fallback to case study 3 section'); // Log adicionado
    setSelectedSection('case_study3');
  } else {
    // Último fallback para basic como padrão se nenhuma seção for encontrada
    console.log('Last fallback to basic section');
    setSelectedSection('basic');
  }
};
