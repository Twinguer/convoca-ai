
import { saveAnswerKeyAndRecalculate } from './saveAnswerKeyService';
import { getAnswerKey } from './getAnswerKeyService';
import { insertAnswersDirectly } from './insertAnswerKeyService';
import { updateSectionTypeForConcurso } from './updateSectionTypeService';

// Exportar todas as funções como um único objeto
export const answerKeyService = {
  saveAnswerKeyAndRecalculate,
  getAnswerKey,
  insertAnswersDirectly,
  updateSectionTypeForConcurso
};

// Também exportar tipos e funções individuais para uso direto
export type { 
  AnswerKeyItem,
  SaveAnswerKeyResult,
  GetAnswerKeyResult
} from './types';

export {
  updateSectionTypeForConcurso
};
