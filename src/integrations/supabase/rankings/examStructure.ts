
// Funções para determinar a estrutura do exame

// Obtém os limites das seções do exame com base nos dados do concurso
export const getExamStructure = (concurso: any) => {
  const basicEnd = concurso.basic_knowledge_questions || 0;
  const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
  const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);
  
  return { basicEnd, specific1End, specific2End };
};

// Determina a seção de uma questão com base em seu número
export const getQuestionSection = (
  questionNumber: number, 
  basicEnd: number, 
  specific1End: number, 
  specific2End: number
) => {
  if (questionNumber <= basicEnd) {
    return 'basic';
  } else if (questionNumber <= specific1End) {
    return 'specific1';
  } else if (questionNumber <= specific2End) {
    return 'specific2';
  } else {
    return 'specific3';
  }
};
