
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
    selectedBookletIdLength: selectedBookletId?.length,
    selectedBookletIdTrimmed: selectedBookletId?.trim(),
    isEmpty: selectedBookletId?.trim() === '',
    isUndefined: selectedBookletId === undefined,
    isNull: selectedBookletId === null
  });
  
  // Verificar se o usuário já atingiu o limite de edições (5)
  if (editCount >= 5) {
    console.log('[validateSaveAnswers] Falha: limite de edições atingido');
    return {
      isValid: false,
      errorMessage: "Você já atingiu o limite de 5 edições permitidas para este cartão de respostas."
    };
  }

  // Verificar se um caderno foi selecionado (permitir string vazia se há cadernos disponíveis)
  if (!selectedBookletId || selectedBookletId.trim() === '') {
    console.log('[validateSaveAnswers] Aviso: caderno não selecionado, mas permitindo salvamento com caderno padrão');
    // Não retornar erro aqui, deixar o useSaveAnswers resolver o caderno padrão
  }

  console.log('[validateSaveAnswers] Validação passou');
  return { isValid: true };
};
