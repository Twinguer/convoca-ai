
import { Concurso } from '@/types/concursos';
import { SectionType } from '@/integrations/supabase/rankings/examStructure';

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

  // Verificar seções de disciplinas específicas
  const disciplineFlags = [
    { type: 'lpt', hasFlag: 'has_lpt' },
    { type: 'ing', hasFlag: 'has_ing' },
    { type: 'mat', hasFlag: 'has_mat' },
    { type: 'rlm', hasFlag: 'has_rlm' },
    { type: 'est', hasFlag: 'has_est' },
    { type: 'cos', hasFlag: 'has_cos' },
    { type: 'adm', hasFlag: 'has_adm' },
    { type: 'ado', hasFlag: 'has_ado' },
    { type: 'cot', hasFlag: 'has_cot' },
    { type: 'coc', hasFlag: 'has_coc' },
    { type: 'eco', hasFlag: 'has_eco' },
    { type: 'tri', hasFlag: 'has_tri' },
    { type: 'afo', hasFlag: 'has_afo' },
    { type: 'ltc', hasFlag: 'has_ltc' },
    { type: 'tic', hasFlag: 'has_tic' },
    { type: 'ett', hasFlag: 'has_ett' },
    { type: 'aud', hasFlag: 'has_aud' },
    { type: 'civ', hasFlag: 'has_civ' },
    { type: 'pen', hasFlag: 'has_pen' },
    { type: 'inf', hasFlag: 'has_inf' },
    { type: 'emp', hasFlag: 'has_emp' },
    { type: 'mtf', hasFlag: 'has_mtf' },
    { type: 'out', hasFlag: 'has_out' }
  ];

  for (const { type, hasFlag } of disciplineFlags) {
    if (concurso[hasFlag as keyof Concurso]) {
      setSelectedSection(type);
      return;
    }
  }

  // Verificar seções customizadas (disciplines)
  if (concurso.disciplines && Array.isArray(concurso.disciplines) && concurso.disciplines.length > 0) {
    const firstDiscipline = concurso.disciplines[0];
    if (firstDiscipline && firstDiscipline.type) {
      setSelectedSection(firstDiscipline.type);
      return;
    }
  }

  // Caso não encontre nenhuma seção disponível
  setSelectedSection('basic');
};
