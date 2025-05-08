
export const createAnswerMatrix = (sectionQuestions: number[]) => {
  if (sectionQuestions.length === 0) return [];
  
  const QUESTIONS_PER_ROW = 4; // Changed from 5 to 4 for better display
  const rows = Math.ceil(sectionQuestions.length / QUESTIONS_PER_ROW);
  
  const matrix = [];
  
  for (let row = 0; row < rows; row++) {
    const rowData = [];
    for (let col = 0; col < QUESTIONS_PER_ROW; col++) {
      const index = row * QUESTIONS_PER_ROW + col;
      if (index < sectionQuestions.length) {
        rowData.push(sectionQuestions[index]);
      } else {
        rowData.push(null);
      }
    }
    matrix.push(rowData);
  }
  
  return matrix;
};
