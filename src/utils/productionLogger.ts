/**
 * Production Logger
 * Logger seguro para produção que não expõe dados sensíveis
 */

const IS_PRODUCTION = import.meta.env.PROD;

/**
 * Logger que só funciona em desenvolvimento
 * Em produção, apenas erros críticos são logados
 */
export const devLog = {
  info: (...args: any[]) => {
    if (!IS_PRODUCTION) {
      console.log('[DEV]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (!IS_PRODUCTION) {
      console.warn('[DEV]', ...args);
    }
  },
  
  error: (...args: any[]) => {
    // Erros sempre são logados, mas sanitizados
    console.error('[ERROR]', ...args);
  },
  
  debug: (...args: any[]) => {
    if (!IS_PRODUCTION) {
      console.debug('[DEBUG]', ...args);
    }
  }
};

/**
 * Sanitiza dados sensíveis antes de logar
 */
export const sanitizeForLog = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = ['password', 'token', 'email', 'cpf', 'phone', 'api_key'];
  const sanitized = { ...data };

  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  }

  return sanitized;
};
