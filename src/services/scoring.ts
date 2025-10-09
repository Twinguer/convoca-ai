export type ExamType = 'Alternativas' | 'Certo ou Errado';

export interface ScoringInput {
  examType: ExamType;
  wrongAnswerPenalty?: number; // só usado em C/E
  questionWeight?: number; // default 1
  disciplineWeight?: number; // default 1
  isCorrect: boolean;
  isNullified?: boolean;
  isBlank?: boolean;
  concursoId?: string; // para validação de segurança
}

export interface ScoringOutput {
  totalDelta: number; // delta na pontuação total
  disciplineDelta: number; // delta para disciplineScores (contagem de acertos)
  weightedDisciplineDelta: number; // delta para weightedDisciplineScores
}

/**
 * @deprecated REMOVIDO POR SEGURANÇA - Use apenas backend
 * Esta função foi removida para evitar cálculos no frontend
 */
export function scoreObjectiveAnswer(input: ScoringInput): ScoringOutput {
  throw new Error('Cálculos de pontuação devem ser feitos no backend por segurança');
}


