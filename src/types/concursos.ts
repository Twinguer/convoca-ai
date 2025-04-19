
export interface AnswerKey {
  id: string;
  concurso_id: string;
  question_number: number;
  answer: string;
  is_basic_knowledge: boolean;
  is_specific_1: boolean;
  is_specific_2: boolean;
  is_specific_3?: boolean;
  is_nullified?: boolean; // Novo campo
}
