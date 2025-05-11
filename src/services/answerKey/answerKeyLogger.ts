
/**
 * Utilitário para logar operações relacionadas a gabaritos
 */
export const answerKeyLogger = {
  info: (message: string, data?: any) => {
    console.log(`[answerKeyService] ${message}`, data || '');
  },
  
  error: (message: string, error: any) => {
    console.error(`[answerKeyService] ${message}:`, error);
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[answerKeyService] ${message}`, data || '');
  },
  
  debug: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[answerKeyService:debug] ${message}`, data || '');
    }
  }
};
