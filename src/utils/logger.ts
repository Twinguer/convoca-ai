/**
 * Sistema de logging condicional
 * Funciona apenas em ambiente de desenvolvimento
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      level: 'debug'
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    return levels[level] >= levels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return `${prefix} ${message}`;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(`🔍 ${this.formatMessage('debug', message)}`, data || '');
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.info(`ℹ️ ${this.formatMessage('info', message)}`, data || '');
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️ ${this.formatMessage('warn', message)}`, data || '');
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog('error')) {
      console.error(`❌ ${this.formatMessage('error', message)}`, error || '');
    }
  }

  // Método para configurar o logger
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Método para desabilitar logs em produção
  disable(): void {
    this.config.enabled = false;
  }
}

// Instância singleton
export const logger = new Logger();

// Exportar tipos para uso em outros arquivos
export type { LogLevel, LoggerConfig };
