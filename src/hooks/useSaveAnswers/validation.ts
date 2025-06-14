
import { toast } from 'sonner';

export const validateSaveAnswers = (
  editCount: number,
  selectedBookletId?: string
): { isValid: boolean; errorMessage?: string } => {
  // Verificar se o usuário já atingiu o limite de edições (5)
  if (editCount >= 5) {
    return {
      isValid: false,
      errorMessage: "Você já atingiu o limite de 5 edições permitidas para este cartão de respostas."
    };
  }

  // Verificar se um caderno foi selecionado
  if (!selectedBookletId) {
    return {
      isValid: false,
      errorMessage: "É necessário selecionar um caderno de prova antes de salvar as respostas."
    };
  }

  return { isValid: true };
};
