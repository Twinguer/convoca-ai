/**
 * RPC Input Validator
 * Centraliza validação de inputs para chamadas RPC
 */

import { SecurityValidators } from './securityValidators';
import { EnhancedInputValidator } from './enhancedInputValidation';

export class RPCValidator {
  /**
   * Valida código de voucher
   */
  static validateVoucherCode(code: string): string {
    if (!code || typeof code !== 'string') {
      throw new Error('Código de voucher é obrigatório');
    }

    // 1. Validar input básico (SQL injection, XSS)
    const basicValidation = SecurityValidators.validateInput(code);
    if (!basicValidation.isValid) {
      throw new Error(`Código inválido: ${basicValidation.reason}`);
    }

    // 2. Validar formato (apenas letras, números, hífen)
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 3 || trimmed.length > 50) {
      throw new Error('Código deve ter entre 3 e 50 caracteres');
    }

    if (!/^[A-Z0-9-]+$/.test(trimmed)) {
      throw new Error('Código deve conter apenas letras, números e hífens');
    }

    return trimmed;
  }

  /**
   * Valida UUID
   */
  static validateUUID(id: string, fieldName: string = 'ID'): string {
    if (!id || typeof id !== 'string') {
      throw new Error(`${fieldName} é obrigatório`);
    }

    if (!SecurityValidators.validateUUID(id)) {
      throw new Error(`${fieldName} possui formato inválido`);
    }

    return id;
  }

  /**
   * Valida número de questão
   */
  static validateQuestionNumber(questionNum: number | string, maxQuestions: number = 200): number {
    const num = typeof questionNum === 'string' ? parseInt(questionNum, 10) : questionNum;

    if (isNaN(num) || !isFinite(num)) {
      throw new Error(`Número de questão inválido: ${questionNum}`);
    }

    if (num < 1 || num > maxQuestions) {
      throw new Error(`Número de questão deve estar entre 1 e ${maxQuestions}`);
    }

    return num;
  }

  /**
   * Valida respostas (JSONB de respostas)
   */
  static validateAnswersJSONB(answers: Record<string, string>, maxQuestions: number = 200): Record<string, string> {
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      throw new Error('Respostas devem ser um objeto');
    }

    const validated: Record<string, string> = {};
    const questionNumbers = new Set<number>();

    for (const [key, value] of Object.entries(answers)) {
      // Validar número da questão
      const questionNum = this.validateQuestionNumber(key, maxQuestions);
      
      // Evitar duplicatas
      if (questionNumbers.has(questionNum)) {
        throw new Error(`Questão ${key} duplicada`);
      }
      questionNumbers.add(questionNum);

      // Validar resposta
      if (typeof value !== 'string') {
        throw new Error(`Resposta da questão ${key} deve ser uma string`);
      }

      if (value.length === 0 || value.length > 10) {
        throw new Error(`Resposta da questão ${key} inválida (tamanho: ${value.length})`);
      }

      // Validar formato da resposta (apenas letras A-E ou vazio)
      if (value && !/^[A-E]$/i.test(value.trim())) {
        throw new Error(`Resposta da questão ${key} deve ser A, B, C, D ou E`);
      }

      validated[questionNum.toString()] = value.trim().toUpperCase();
    }

    return validated;
  }

  /**
   * Valida pontuações subjetivas (JSONB)
   */
  static validateSubjectiveScores(scores: {
    discursive?: number;
    case_study_1?: number;
    case_study_2?: number;
    case_study_3?: number;
  }): {
    discursive: number;
    case_study_1: number;
    case_study_2: number;
    case_study_3: number;
  } {
    if (!scores || typeof scores !== 'object' || Array.isArray(scores)) {
      throw new Error('Pontuações subjetivas devem ser um objeto');
    }

    const validateScore = (value: any, fieldName: string): number => {
      const num = typeof value === 'number' ? value : parseFloat(value);
      
      if (isNaN(num) || !isFinite(num)) {
        throw new Error(`${fieldName} deve ser um número válido`);
      }

      if (num < 0 || num > 1000) {
        throw new Error(`${fieldName} deve estar entre 0 e 1000`);
      }

      return Math.round(num * 100) / 100; // Arredondar para 2 casas decimais
    };

    return {
      discursive: validateScore(scores.discursive ?? 0, 'Pontuação discursiva'),
      case_study_1: validateScore(scores.case_study_1 ?? 0, 'Estudo de caso 1'),
      case_study_2: validateScore(scores.case_study_2 ?? 0, 'Estudo de caso 2'),
      case_study_3: validateScore(scores.case_study_3 ?? 0, 'Estudo de caso 3')
    };
  }

  /**
   * Valida contador de edições
   */
  static validateEditCount(editCount: number): number {
    if (typeof editCount !== 'number' || isNaN(editCount) || !isFinite(editCount)) {
      throw new Error('Contador de edições deve ser um número válido');
    }

    if (editCount < 0 || editCount > 10000) {
      throw new Error('Contador de edições deve estar entre 0 e 10000');
    }

    return Math.floor(editCount);
  }

  /**
   * Valida tipo de reserva (cota)
   */
  static validateReservationType(reservationType: string | null | undefined): string | null {
    if (reservationType === null || reservationType === undefined || reservationType === '') {
      return null;
    }

    if (typeof reservationType !== 'string') {
      throw new Error('Tipo de reserva deve ser uma string');
    }

    const validTypes = ['AC', 'PPI', 'PC', 'PD', 'PCD'];
    const upper = reservationType.trim().toUpperCase();

    if (!validTypes.includes(upper)) {
      throw new Error(`Tipo de reserva inválido. Permitidos: ${validTypes.join(', ')}`);
    }

    return upper;
  }

  /**
   * Valida ID de caderno
   */
  static validateBookletId(bookletId: string | null | undefined): string | null {
    if (bookletId === null || bookletId === undefined || bookletId === '') {
      return null;
    }

    if (typeof bookletId !== 'string') {
      throw new Error('ID do caderno deve ser uma string');
    }

    const trimmed = bookletId.trim();
    
    if (trimmed.length === 0 || trimmed.length > 50) {
      throw new Error('ID do caderno inválido');
    }

    // Validar formato (apenas letras, números, hífen, underscore)
    if (!/^[A-Z0-9_-]+$/i.test(trimmed)) {
      throw new Error('ID do caderno contém caracteres inválidos');
    }

    return trimmed;
  }

  /**
   * Valida dados de ranking (JSONB)
   */
  static validateRankingData(data: any): any {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Dados de ranking devem ser um objeto');
    }

    // Validar estrutura básica
    const validated: any = {};

    // Validar edit_count se presente
    if (data.edit_count !== undefined) {
      validated.edit_count = this.validateEditCount(data.edit_count);
    }

    // Validar selected_booklet_id se presente
    if (data.selected_booklet_id !== undefined) {
      validated.selected_booklet_id = this.validateBookletId(data.selected_booklet_id);
    }

    // Outros campos podem ser adicionados conforme necessário

    return validated;
  }
}

