
import { toast } from 'sonner';

export const validateSaveAnswers = (
  editCount: number,
  selectedBookletId?: string
): { isValid: boolean; errorMessage?: string } => {
  console.log('[validateSaveAnswers] Validando:', { 
    editCount, 
    selectedBookletId,
    editCountType: typeof editCount,
    selectedBookletIdType: typeof selectedBookletId,
    selectedBookletIdLength: selectedBookletId?.length
  });
  
  // Verificar se o usuário já atingiu o limite de edições (5)
  if (editCount >= 5) {
    console.log('[validateSaveAnswers] Falha: limite de edições atingido');
    return {
      isValid: false,
      errorMessage: "Você já atingiu o limite de 5 edições permitidas para este cartão de respostas."
    };
  }

  // Verificar se um caderno foi selecionado
  if (!selectedBookletId || selectedBookletId.trim() === '') {
    console.log('[validateSaveAnswers] Falha: caderno não selecionado ou vazio');
    return {
      isValid: false,
      errorMessage: "É necessário selecionar um caderno de prova antes de salvar as respostas."
    };
  }

  console.log('[validateSaveAnswers] Validação passou');
  return { isValid: true };
};
