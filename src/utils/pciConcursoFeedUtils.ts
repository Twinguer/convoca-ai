import type { PciConcursoFeedItem, PciNivelFilter } from '@/types/pciConcursoFeed';

export function inferNiveis(escolaridade: string): PciNivelFilter[] {
  const t = (escolaridade || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const niveis: PciNivelFilter[] = [];
  if (/fundamental/.test(t)) niveis.push('fundamental');
  if (/medio|médio/.test(t) || /tecnico|técnico/.test(t)) niveis.push('medio');
  if (/superior/.test(t)) niveis.push('superior');
  return [...new Set(niveis)];
}

export function matchesNivel(item: PciConcursoFeedItem, nivel: PciNivelFilter): boolean {
  if (!nivel) return true;
  return inferNiveis(item.escolaridade).includes(nivel);
}

export function filterPciItems(
  items: PciConcursoFeedItem[],
  query: string,
  nivel: PciNivelFilter,
): PciConcursoFeedItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (!matchesNivel(item, nivel)) return false;
    if (!q) return true;
    const hay = `${item.titulo} ${item.cargos || ''} ${item.uf || ''} ${item.escolaridade}`.toLowerCase();
    return hay.includes(q);
  });
}

export function daysUntilInscricao(dateStr: string | null | undefined): number | null {
  if (!dateStr || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return null;
  const [d, m, y] = dateStr.split('/').map(Number);
  const end = new Date(y, m - 1, d, 23, 59, 59);
  return Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function formatBRL(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function getGridColumnCount(containerWidth: number): number {
  const CARD_MIN = 300;
  const GAP = 14;
  return Math.max(1, Math.floor((containerWidth + GAP) / (CARD_MIN + GAP)));
}
