
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

// Verifica se uma questão pertence a uma determinada seção
export const isQuestionInSection = (
  questionNumber: number,
  section: 'basic' | 'specific1' | 'specific2' | 'specific3',
  concurso: any
) => {
  const { basicEnd, specific1End, specific2End } = getExamStructure(concurso);
  
  switch (section) {
    case 'basic':
      return questionNumber <= basicEnd;
    case 'specific1':
      return questionNumber > basicEnd && questionNumber <= specific1End;
    case 'specific2':
      return questionNumber > specific1End && questionNumber <= specific2End;
    case 'specific3':
      return questionNumber > specific2End;
    default:
      return false;
  }
};
