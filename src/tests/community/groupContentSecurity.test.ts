import { describe, expect, it } from 'vitest';
import {
  MAX_GROUP_CONTENT_LENGTH,
  sanitizeGroupContent,
  validateGroupContent,
} from '@/modules/community/domain/groupContentSecurity';

describe('groupContentSecurity', () => {
  it('remove tags HTML e preserva texto útil', () => {
    expect(sanitizeGroupContent('Olá <b>mundo</b> <script>alert(1)</script>')).toBe('Olá mundo');
  });

  it('preserva blocos de código como texto', () => {
    const code = 'SELECT * FROM users;';
    expect(sanitizeGroupContent(code)).toBe(code);
  });

  it('rejeita conteúdo vazio', () => {
    expect(validateGroupContent('   <br>')).toEqual({
      ok: false,
      error: 'O conteúdo não pode ser vazio.',
    });
  });

  it('aceita conteúdo válido dentro do limite', () => {
    const text = 'Comentário com @usuario';
    expect(validateGroupContent(text)).toEqual({ ok: true, value: text });
  });

  it('rejeita conteúdo acima do limite', () => {
    const longText = 'a'.repeat(MAX_GROUP_CONTENT_LENGTH + 1);
    expect(validateGroupContent(longText).ok).toBe(false);
  });
});
