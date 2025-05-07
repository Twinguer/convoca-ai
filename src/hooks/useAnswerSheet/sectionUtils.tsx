
import { Concurso } from '@/types/concursos';

// Tipo unificado para as seções
export type SectionType = 'basic' | 'specific1' | 'specific2' | 'specific3' | 'discursive' | 'case_study1' | 'case_study2' | 'case_study3';

// Função unificada para seleção de seção
export const handleQuestionSectionSelection = (
  concurso: Concurso,
  setSelectedSection: React.Dispatch<React.SetStateAction<SectionType>>
) => {
  // Para ambos os tipos de concurso, vamos sempre começar pela seção 'basic'
  setSelectedSection('basic');
  
  // Se não tiver conhecimentos básicos ou a estrutura for baseada em disciplinas, verificamos as outras seções
  if (!concurso.has_basic_knowledge && concurso.has_specific_knowledge_1) {
    setSelectedSection('specific1');
  } else if (!concurso.has_basic_knowledge && !concurso.has_specific_knowledge_1 && concurso.has_specific_knowledge_2) {
    setSelectedSection('specific2');
  } else if (!concurso.has_basic_knowledge && !concurso.has_specific_knowledge_1 && !concurso.has_specific_knowledge_2 && concurso.has_specific_knowledge_3) {
    setSelectedSection('specific3');
  }
};

// Função unificada para obter informações da seção
export const getSectionInfo = (concurso: Concurso) => {
  // Para ambos os tipos de concurso, retornamos informações estruturais unificadas
  return {
    hasBasicKnowledge: concurso.minimum_score_type === 'subject' ? true : concurso.has_basic_knowledge,
    hasSpecificKnowledge1: concurso.minimum_score_type === 'subject' ? false : concurso.has_specific_knowledge_1,
    hasSpecificKnowledge2: concurso.minimum_score_type === 'subject' ? false : concurso.has_specific_knowledge_2,
    hasSpecificKnowledge3: concurso.minimum_score_type === 'subject' ? false : concurso.has_specific_knowledge_3,
    
    // Informações sobre quantidade de questões
    basicKnowledgeQuestions: concurso.minimum_score_type === 'subject' ? 
      (Array.isArray(concurso.subjects) ? concurso.subjects.reduce((total, subject) => total + (subject.question_count || 0), 0) : 0) : 
      concurso.basic_knowledge_questions || 0,
    specificKnowledge1Questions: concurso.has_specific_knowledge_1 ? concurso.specific_knowledge_1_questions || 0 : 0,
    specificKnowledge2Questions: concurso.has_specific_knowledge_2 ? concurso.specific_knowledge_2_questions || 0 : 0,
    specificKnowledge3Questions: concurso.has_specific_knowledge_3 ? concurso.specific_knowledge_3_questions || 0 : 0,
    
    // Informações sobre provas discursivas e estudos de caso
    hasDiscursive: concurso.has_discursive,
    hasCaseStudy1: concurso.has_case_study_1,
    hasCaseStudy2: concurso.has_case_study_2,
    hasCaseStudy3: concurso.has_case_study_3
  };
};

// Exportar o tipo para ser usado nos outros arquivos
export type { SectionType };
