
export const createAnswerMatrix = (questions: number[]) => {
  if (questions.length === 0) return [];
  
  const QUESTIONS_PER_ROW = 4;
  const rows = Math.ceil(questions.length / QUESTIONS_PER_ROW);
  
  const matrix = [];
  
  for (let row = 0; row < rows; row++) {
    const rowData = [];
    for (let col = 0; col < QUESTIONS_PER_ROW; col++) {
      const index = row * QUESTIONS_PER_ROW + col;
      if (index < questions.length) {
        rowData.push(questions[index]);
      } else {
        rowData.push(null);
      }
    }
    matrix.push(rowData);
  }
  
  return matrix;
};
