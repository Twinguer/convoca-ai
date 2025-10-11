import { describe, it, expect } from 'vitest';
import { scoreObjectiveAnswer } from './scoring';

describe('scoreObjectiveAnswer - Certo ou Errado', () => {
  it('não deve penalizar quando Sem penalidade (0)', () => {
    const res = scoreObjectiveAnswer({
      examType: 'Certo ou Errado',
      wrongAnswerPenalty: 0,
      questionWeight: 1,
      disciplineWeight: 1,
      isCorrect: false,
      isBlank: false,
      isNullified: false,
    });
    expect(res.totalDelta).toBe(0);
    expect(res.disciplineDelta).toBe(0);
    expect(res.weightedDisciplineDelta).toBe(0);
  });

  it('deve penalizar quando penalty > 0', () => {
    const res = scoreObjectiveAnswer({
      examType: 'Certo ou Errado',
      wrongAnswerPenalty: 0.5,
      questionWeight: 1,
      disciplineWeight: 2,
      isCorrect: false,
      isBlank: false,
      isNullified: false,
    });
    expect(res.totalDelta).toBe(-0.5);
    expect(res.disciplineDelta).toBe(0);
    expect(res.weightedDisciplineDelta).toBe(-1); // 0.5 * 2 (penalty * disciplineWeight)
  });

  it('deve aplicar penalidade mesmo quando peso da questão é 0', () => {
    const res = scoreObjectiveAnswer({
      examType: 'Certo ou Errado',
      wrongAnswerPenalty: 1,
      questionWeight: 0,
      disciplineWeight: 3,
      isCorrect: false,
      isBlank: false,
      isNullified: false,
    });
    expect(res.totalDelta).toBe(-1); // Penalidade é aplicada independentemente do peso da questão
    expect(res.weightedDisciplineDelta).toBe(-3); // 1 * 3 (penalty * disciplineWeight)
  });

  it('deve somar em acerto e anulação', () => {
    const res = scoreObjectiveAnswer({
      examType: 'Certo ou Errado',
      wrongAnswerPenalty: 0.5,
      questionWeight: 1,
      disciplineWeight: 2,
      isCorrect: true,
      isBlank: false,
      isNullified: true,
    });
    expect(res.totalDelta).toBe(1);
    expect(res.disciplineDelta).toBe(1);
    expect(res.weightedDisciplineDelta).toBe(2);
  });

  it('deve somar em acerto sem anulação', () => {
    const res = scoreObjectiveAnswer({
      examType: 'Certo ou Errado',
      wrongAnswerPenalty: 0.5,
      questionWeight: 1,
      disciplineWeight: 2,
      isCorrect: true,
      isBlank: false,
      isNullified: false,
    });
    expect(res.totalDelta).toBe(1);
    expect(res.disciplineDelta).toBe(1);
    expect(res.weightedDisciplineDelta).toBe(2);
  });

  it('deve aplicar penalidade de 1 ponto corretamente', () => {
    const res = scoreObjectiveAnswer({
      examType: 'Certo ou Errado',
      wrongAnswerPenalty: 1,
      questionWeight: 1,
      disciplineWeight: 1,
      isCorrect: false,
      isBlank: false,
      isNullified: false,
    });
    expect(res.totalDelta).toBe(-1);
    expect(res.disciplineDelta).toBe(0);
    expect(res.weightedDisciplineDelta).toBe(-1);
  });

  it('deve aplicar penalidade de 1.5 pontos corretamente', () => {
    const res = scoreObjectiveAnswer({
      examType: 'Certo ou Errado',
      wrongAnswerPenalty: 1.5,
      questionWeight: 1,
      disciplineWeight: 2,
      isCorrect: false,
      isBlank: false,
      isNullified: false,
    });
    expect(res.totalDelta).toBe(-1.5);
    expect(res.disciplineDelta).toBe(0);
    expect(res.weightedDisciplineDelta).toBe(-3); // 1.5 * 2
  });

  it('deve aplicar penalidade de 2 pontos corretamente', () => {
    const res = scoreObjectiveAnswer({
      examType: 'Certo ou Errado',
      wrongAnswerPenalty: 2,
      questionWeight: 1,
      disciplineWeight: 1,
      isCorrect: false,
      isBlank: false,
      isNullified: false,
    });
    expect(res.totalDelta).toBe(-2);
    expect(res.disciplineDelta).toBe(0);
    expect(res.weightedDisciplineDelta).toBe(-2);
  });
});

describe('scoreObjectiveAnswer - Alternativas', () => {
  it('deve somar em acerto', () => {
    const res = scoreObjectiveAnswer({
      examType: 'Alternativas',
      wrongAnswerPenalty: 0,
      questionWeight: 1,
      disciplineWeight: 1,
      isCorrect: true,
      isBlank: false,
      isNullified: false,
    });
    expect(res.totalDelta).toBe(1);
    expect(res.disciplineDelta).toBe(1);
    expect(res.weightedDisciplineDelta).toBe(1);
  });

  it('não deve penalizar em erro', () => {
    const res = scoreObjectiveAnswer({
      examType: 'Alternativas',
      wrongAnswerPenalty: 0,
      questionWeight: 1,
      disciplineWeight: 1,
      isCorrect: false,
      isBlank: false,
      isNullified: false,
    });
    expect(res.totalDelta).toBe(0);
    expect(res.disciplineDelta).toBe(0);
    expect(res.weightedDisciplineDelta).toBe(0);
  });
});


