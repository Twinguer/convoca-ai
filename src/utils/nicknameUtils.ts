/** Remove @ no início e espaços; nickname no banco não deve incluir @. */
export function stripNicknamePrefix(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().replace(/^@+/, '');
}

/** Exibe handle público (@nickname) sem duplicar @. */
export function formatPublicNicknameHandle(value: string | null | undefined): string | null {
  const handle = stripNicknamePrefix(value);
  return handle ? `@${handle}` : null;
}
