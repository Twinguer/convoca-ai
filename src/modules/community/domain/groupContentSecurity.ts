import DOMPurify from 'dompurify';

export const MAX_GROUP_CONTENT_LENGTH = 500;

export function sanitizeGroupContent(content: string): string {
  const withoutHtml = DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return withoutHtml.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

export function validateGroupContent(
  content: string,
  options: { allowEmpty?: boolean } = {}
): { ok: true; value: string } | { ok: false; error: string } {
  const sanitized = sanitizeGroupContent(content);

  if (!options.allowEmpty && sanitized.length === 0) {
    return { ok: false, error: 'O conteúdo não pode ser vazio.' };
  }

  if (sanitized.length > MAX_GROUP_CONTENT_LENGTH) {
    return {
      ok: false,
      error: `O conteúdo excede ${MAX_GROUP_CONTENT_LENGTH} caracteres.`,
    };
  }

  return { ok: true, value: sanitized };
}
