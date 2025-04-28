
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';

export interface QuestionBlock {
  id?: string;
  name: string;
  startIndex: number;
  endIndex: number;
  weight: number;
}

export interface QuestionAnswer {
  type: QuestionType;
  correctAnswer: string;
  weight: number;
  isNullified: boolean;
  pointsIfCorrect?: number;
  pointsIfWrong?: number;
}
