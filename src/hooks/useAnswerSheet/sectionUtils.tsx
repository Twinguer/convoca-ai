
import { Concurso } from '@/types/concursos';

export const handleQuestionSectionSelection = (
  concurso: Concurso,
  setSelectedSection: React.Dispatch<React.SetStateAction<'basic' | 'specific1' | 'specific2' | 'specific3' | 'discursive' | 'case_study1' | 'case_study2' | 'case_study3'>>
) => {
  // Para ambos os tipos de concurso, vamos começar sempre pela seção 'basic'
  // A diferença estará apenas na apresentação/nome da seção na interface
  setSelectedSection('basic');
  
  // Se não tiver conhecimentos básicos, verificamos as outras seções
  if (!concurso.has_basic_knowledge && concurso.has_specific_knowledge_1) {
    setSelectedSection('specific1');
  } else if (!concurso.has_basic_knowledge && !concurso.has_specific_knowledge_1 && concurso.has_specific_knowledge_2) {
    setSelectedSection('specific2');
  } else if (!concurso.has_basic_knowledge && !concurso.has_specific_knowledge_1 && !concurso.has_specific_knowledge_2 && concurso.has_specific_knowledge_3) {
    setSelectedSection('specific3');
  }
};

export const getSectionInfo = (concurso: Concurso) => {
  if (concurso.minimum_score_type === 'subject') {
    // Para provas baseadas em disciplinas
    const subjects = Array.isArray(concurso.subjects) ? concurso.subjects : [];
    
    return {
      hasSubjects: subjects.length > 0,
      subjects,
      totalQuestions: subjects.reduce((total, subject) => total + (subject.question_count || 0), 0),
      hasDiscursive: concurso.has_discursive,
      hasCaseStudy1: concurso.has_case_study_1,
      hasCaseStudy2: concurso.has_case_study_2,
      hasCaseStudy3: concurso.has_case_study_3
    };
  } else {
    // Para provas baseadas em conhecimentos
    return {
      hasBasicKnowledge: concurso.has_basic_knowledge,
      hasSpecificKnowledge1: concurso.has_specific_knowledge_1,
      hasSpecificKnowledge2: concurso.has_specific_knowledge_2,
      hasSpecificKnowledge3: concurso.has_specific_knowledge_3,
      basicKnowledgeQuestions: concurso.basic_knowledge_questions || 0,
      specificKnowledge1Questions: concurso.specific_knowledge_1_questions || 0,
      specificKnowledge2Questions: concurso.specific_knowledge_2_questions || 0,
      specificKnowledge3Questions: concurso.specific_knowledge_3_questions || 0,
      hasDiscursive: concurso.has_discursive,
      hasCaseStudy1: concurso.has_case_study_1,
      hasCaseStudy2: concurso.has_case_study_2,
      hasCaseStudy3: concurso.has_case_study_3
    };
  }
};
