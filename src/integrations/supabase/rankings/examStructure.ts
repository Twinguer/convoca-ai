
/**
 * Get the exam structure based on the concurso configuration
 * @param concurso The concurso object with question counts
 * @returns Object with indices marking the end of each section
 */
export const getExamStructure = (concurso: any) => {
  const basicKnowledgeQuestions = concurso?.basic_knowledge_questions || 0;
  const specific1Questions = concurso?.specific_knowledge_1_questions || 0;
  const specific2Questions = concurso?.specific_knowledge_2_questions || 0;
  
  // Calculate the end of each section
  const basicEnd = basicKnowledgeQuestions;
  const specific1End = basicEnd + specific1Questions;
  const specific2End = specific1End + specific2Questions;
  
  return {
    basicEnd,
    specific1End,
    specific2End
  };
};
