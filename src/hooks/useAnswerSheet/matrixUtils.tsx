
export const createAnswerMatrix = (questionNumbers: number[] = []) => {
  // Se não houver questões, retorna uma matriz vazia
  if (!questionNumbers.length) return [];

  // Ordena questões para garantir que estão em ordem
  const sortedNumbers = [...questionNumbers].sort((a, b) => a - b);
  
  // Determina o número de questões por linha
  const questionsPerRow = 5;
  
  // Calcula quantas linhas são necessárias
  const rowsCount = Math.ceil(sortedNumbers.length / questionsPerRow);
  
  // Cria a matriz com as questões distribuídas em linhas
  const matrix = [];
  for (let i = 0; i < rowsCount; i++) {
    // Extrai as questões para esta linha
    const startIdx = i * questionsPerRow;
    const row = sortedNumbers.slice(startIdx, startIdx + questionsPerRow);
    
    // Adiciona a linha à matriz
    matrix.push(row);
  }
  
  return matrix;
};
