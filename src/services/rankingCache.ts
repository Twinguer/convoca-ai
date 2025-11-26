/**
 * Cache simples para rankings
 * Sistema leve e funcional
 */

// ✅ FASE 1: Migrar para usar interface RankingV3
import type { RankingV3 as Ranking } from '@/services/rankingServiceV3';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class RankingCache {
  private cache = new Map<string, CacheEntry<any>>();
  
  // TTL simples: 5 minutos para todos os dados
  private readonly TTL = 5 * 60 * 1000;

  /**
   * Armazena dados no cache
   */
  set<T>(key: string, data: T): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now()
    };

    this.cache.set(key, entry);
  }

  /**
   * Recupera dados do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar se expirou
    const now = Date.now();
    if (now - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Remove entrada específica do cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Verifica se uma chave existe no cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Verificar se expirou
    const now = Date.now();
    if (now - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Métodos específicos para rankings
   */
  setRankings(concursoId: string, rankings: Ranking[], page: number, limit: number): void {
    const key = `rankings:${concursoId}:${page}:${limit}`;
    this.set(key, rankings);
  }

  getRankings(concursoId: string, page: number, limit: number): Ranking[] | null {
    const key = `rankings:${concursoId}:${page}:${limit}`;
    return this.get<Ranking[]>(key);
  }

  setConcurso(concursoId: string, concurso: any): void {
    const key = `concurso:${concursoId}`;
    this.set(key, concurso);
  }

  getConcurso(concursoId: string): any | null {
    const key = `concurso:${concursoId}`;
    return this.get(key);
  }

  /**
   * Limpeza automática de entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Obtém estatísticas básicas do cache
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instância singleton do cache
export const rankingCache = new RankingCache();

// Limpeza automática removida - será feita sob demanda