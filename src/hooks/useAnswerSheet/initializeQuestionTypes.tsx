
import { Concurso } from '@/types/concursos';

export const createQuestionOptions = (concurso: Concurso): Record<number, string[]> => {
  const questionOptions: Record<number, string[]> = {};
  
  if (!concurso) return questionOptions;
  
  const examType = concurso.exam_type || 'Alternativas';
  const alternativesCount = concurso.alternatives_count || 5;
  
  let questionNumber = 1;
  const totalQuestions = getTotalQuestions(concurso);
  
  // Se for prova de Certo ou Errado, todas questões tem as mesmas opções
  if (examType === 'Certo ou Errado') {
    for (let i = 1; i <= totalQuestions; i++) {
      questionOptions[i] = ['C', 'E'];
    }
    return questionOptions;
  }
  
  // Se for prova de alternativas, todas questões tem opções A, B, C, D, E (ou conforme alternativesCount)
  const options = Array.from({ length: alternativesCount }, (_, i) => String.fromCharCode(65 + i));
  
  for (let i = 1; i <= totalQuestions; i++) {
    questionOptions[i] = [...options];
  }
  
  return questionOptions;
};

const getTotalQuestions = (concurso: Concurso): number => {
  if (!concurso) return 0;
  
  if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
    // Para disciplinas customizadas
    let total = 0;
    
    // Verificar se temos estrutura hierárquica (blocos -> disciplinas)
    const isHierarchical = concurso.disciplines.length > 0 && 
                          'disciplines' in concurso.disciplines[0];
    
    if (isHierarchical) {
      // Estrutura hierárquica
      for (const block of concurso.disciplines) {
        if ('disciplines' in block) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.questionCount) {
              total += parseInt(String(discipline.questionCount));
            }
          }
        }
      }
    } else {
      // Estrutura plana
      for (const discipline of concurso.disciplines) {
        if ('isEnabled' in discipline && discipline.isEnabled && discipline.questionCount) {
          total += parseInt(String(discipline.questionCount));
        }
      }
    }
    
    return total;
  } else {
    // Estrutura tradicional
    return (
      (concurso.has_basic_knowledge ? parseInt(String(concurso.basic_knowledge_questions)) || 0 : 0) +
      (concurso.has_specific_knowledge_1 ? parseInt(String(concurso.specific_knowledge_1_questions)) || 0 : 0) +
      (concurso.has_specific_knowledge_2 ? parseInt(String(concurso.specific_knowledge_2_questions)) || 0 : 0) +
      (concurso.has_specific_knowledge_3 ? parseInt(String(concurso.specific_knowledge_3_questions)) || 0 : 0)
    );
  }
};
