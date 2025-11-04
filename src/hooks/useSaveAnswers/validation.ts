
import { toast } from 'sonner';

export const validateSaveAnswers = (
  editCount: number,
  selectedBookletId?: string,
  isPro: boolean = false // Novo parâmetro opcional
): { isValid: boolean; errorMessage?: string } => {
  // Debug logs removed for security
  
  // Verificar limite de edições baseado no plano (Free = 5, Pro = ilimitado)
  if (!isPro && editCount >= 5) {
    console.log('[validateSaveAnswers] Falha: limite de edições atingido');
    return {
      isValid: false,
      errorMessage: "O recurso \"Edições Ilimitadas no Cartão de Respostas\" está disponível apenas no plano Pro."
    };
  }

  // Verificar se um caderno foi selecionado (permitir string vazia se há cadernos disponíveis)
  if (!selectedBookletId || selectedBookletId.trim() === '') {
    console.log('[validateSaveAnswers] Aviso: caderno não selecionado, mas permitindo salvamento com caderno padrão');
    // Não retornar erro aqui, deixar o useSaveAnswers resolver o caderno padrão
  }

  // Debug logs removed for security
  return { isValid: true };
};
