
import { Concurso } from '@/types/concursos';

export interface AnswerKeyItem {
  concurso_id: string;
  question_number: number;
  correct_answer: string;
  weight: number;
  section_type: string;
  is_nullified: boolean;
}

export interface SaveAnswerKeyResult {
  success: boolean;
  error?: string;
  updatedCount?: number;
  insertedCount?: number; // Adicionando esta propriedade que faltava
}

export interface GetAnswerKeyResult {
  success: boolean;
  error?: string;
  data: Record<string, any>;
}
