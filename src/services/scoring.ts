export type ExamType = 'Alternativas' | 'Certo ou Errado';

export interface ScoringInput {
  examType: ExamType;
  wrongAnswerPenalty?: number; // só usado em C/E
  questionWeight?: number; // default 1
  disciplineWeight?: number; // default 1
  isCorrect: boolean;
  isNullified?: boolean;
  isBlank?: boolean;
}

export interface ScoringOutput {
  totalDelta: number; // delta na pontuação total
  disciplineDelta: number; // delta para disciplineScores (contagem de acertos)
  weightedDisciplineDelta: number; // delta para weightedDisciplineScores
}

export function scoreObjectiveAnswer(input: ScoringInput): ScoringOutput {
  const questionWeight = input.questionWeight ?? 1;
  const disciplineWeight = input.disciplineWeight ?? 1;

  const fixNegZero = (n: number) => (n === 0 ? 0 : n);

  // Questão anulada: sempre soma o peso bruto
  if (input.isNullified) {
    return {
      totalDelta: fixNegZero(questionWeight),
      disciplineDelta: 1,
      weightedDisciplineDelta: fixNegZero(questionWeight * disciplineWeight),
    };
  }

  // Em branco: não impacta
  if (input.isBlank) {
    return { totalDelta: 0, disciplineDelta: 0, weightedDisciplineDelta: 0 };
  }

  if (input.isCorrect) {
    return {
      totalDelta: fixNegZero(questionWeight),
      disciplineDelta: 1,
      weightedDisciplineDelta: fixNegZero(questionWeight * disciplineWeight),
    };
  }

  // Errada
  if (input.examType === 'Certo ou Errado') {
    const penalty = input.wrongAnswerPenalty ?? 0;
    if (penalty > 0) {
      return {
        totalDelta: fixNegZero(-penalty), // Penalidade é valor absoluto, não multiplicado pelo peso
        disciplineDelta: 0, // mantemos contagem de acertos apenas com acertos
        weightedDisciplineDelta: fixNegZero(-penalty * disciplineWeight), // Penalidade multiplicada apenas pelo peso da disciplina
      };
    }
  }

  // Errada sem penalidade (ou múltipla escolha): sem impacto
  return { totalDelta: 0, disciplineDelta: 0, weightedDisciplineDelta: 0 };
}


