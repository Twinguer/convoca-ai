import { logger } from '@/utils/logger';

// Interface para cache de rankings
interface RankingCacheEntry {
  data: any[];
  timestamp: number;
  page: number;
  limit: number;
  reservationType?: string;
}

// Interface para cache de dados de ranking
interface RankingDataCacheEntry {
  data: any;
  timestamp: number;
}

// Interface para cache de estatísticas
interface StatsCacheEntry {
  data: any;
  timestamp: number;
}

class RankingCacheV2 {
  private rankingsCache = new Map<string, RankingCacheEntry>();
  private rankingDataCache = new Map<string, RankingDataCacheEntry>();
  private statsCache = new Map<string, StatsCacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private readonly RANKING_DATA_CACHE_DURATION = 10 * 60 * 1000; // 10 minutos
  private readonly STATS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Gerar chave para cache de rankings
  private getRankingKey(rankingId: string, page: number, limit: number, reservationType?: string): string {
    return `ranking-${rankingId}-${page}-${limit}-${reservationType || 'all'}`;
  }

  // Gerar chave para cache de dados de ranking
  private getRankingDataKey(rankingId: string): string {
    return `ranking-data-${rankingId}`;
  }

  // Gerar chave para cache de estatísticas
  private getStatsKey(rankingId: string, userId?: string): string {
    return `stats-${rankingId}-${userId || 'all'}`;
  }

  // Verificar se cache está válido
  private isCacheValid(timestamp: number, duration: number): boolean {
    return Date.now() - timestamp < duration;
  }

  // Limpar cache expirado
  private cleanExpiredCache(): void {
    const now = Date.now();
    
    // Limpar cache de rankings
    for (const [key, entry] of this.rankingsCache.entries()) {
      if (!this.isCacheValid(entry.timestamp, this.CACHE_DURATION)) {
        this.rankingsCache.delete(key);
        logger.cache('Expired ranking cache removed', key);
      }
    }

    // Limpar cache de dados de ranking
    for (const [key, entry] of this.rankingDataCache.entries()) {
      if (!this.isCacheValid(entry.timestamp, this.RANKING_DATA_CACHE_DURATION)) {
        this.rankingDataCache.delete(key);
        logger.cache('Expired ranking data cache removed', key);
      }
    }

    // Limpar cache de estatísticas
    for (const [key, entry] of this.statsCache.entries()) {
      if (!this.isCacheValid(entry.timestamp, this.STATS_CACHE_DURATION)) {
        this.statsCache.delete(key);
        logger.cache('Expired stats cache removed', key);
      }
    }
  }

  // Obter rankings do cache
  getRankings(rankingId: string, page: number, limit: number, reservationType?: string): any[] | null {
    this.cleanExpiredCache();
    
    const key = this.getRankingKey(rankingId, page, limit, reservationType);
    const entry = this.rankingsCache.get(key);
    
    if (entry && this.isCacheValid(entry.timestamp, this.CACHE_DURATION)) {
      logger.cache('Rankings loaded from cache V2', key);
      return entry.data;
    }
    
    return null;
  }

  // Armazenar rankings no cache
  setRankings(rankingId: string, data: any[], page: number, limit: number, reservationType?: string): void {
    const key = this.getRankingKey(rankingId, page, limit, reservationType);
    const entry: RankingCacheEntry = {
      data,
      timestamp: Date.now(),
      page,
      limit,
      reservationType
    };
    
    this.rankingsCache.set(key, entry);
    logger.cache('Rankings stored in cache V2', key, `count: ${data.length}`);
  }

  // Obter dados de ranking do cache
  getRankingData(rankingId: string): any | null {
    this.cleanExpiredCache();
    
    const key = this.getRankingDataKey(rankingId);
    const entry = this.rankingDataCache.get(key);
    
    if (entry && this.isCacheValid(entry.timestamp, this.RANKING_DATA_CACHE_DURATION)) {
      logger.cache('Ranking data loaded from cache V2', key);
      return entry.data;
    }
    
    return null;
  }

  // Armazenar dados de ranking no cache
  setRankingData(rankingId: string, data: any): void {
    const key = this.getRankingDataKey(rankingId);
    const entry: RankingDataCacheEntry = {
      data,
      timestamp: Date.now()
    };
    
    this.rankingDataCache.set(key, entry);
    logger.cache('Ranking data stored in cache V2', key);
  }

  // Obter estatísticas do cache
  getStats(rankingId: string, userId?: string): any | null {
    this.cleanExpiredCache();
    
    const key = this.getStatsKey(rankingId, userId);
    const entry = this.statsCache.get(key);
    
    if (entry && this.isCacheValid(entry.timestamp, this.STATS_CACHE_DURATION)) {
      logger.cache('Stats loaded from cache V2', key);
      return entry.data;
    }
    
    return null;
  }

  // Armazenar estatísticas no cache
  setStats(rankingId: string, data: any, userId?: string): void {
    const key = this.getStatsKey(rankingId, userId);
    const entry: StatsCacheEntry = {
      data,
      timestamp: Date.now()
    };
    
    this.statsCache.set(key, entry);
    logger.cache('Stats stored in cache V2', key);
  }

  // Invalidar cache de um ranking específico
  invalidateRanking(rankingId: string): void {
    // Remover todas as entradas relacionadas ao ranking
    for (const key of this.rankingsCache.keys()) {
      if (key.includes(`ranking-${rankingId}-`)) {
        this.rankingsCache.delete(key);
        logger.cache('Ranking cache invalidated V2', key);
      }
    }

    // Remover dados do ranking
    const rankingDataKey = this.getRankingDataKey(rankingId);
    this.rankingDataCache.delete(rankingDataKey);
    logger.cache('Ranking data cache invalidated V2', rankingDataKey);

    // Remover estatísticas do ranking
    for (const key of this.statsCache.keys()) {
      if (key.includes(`stats-${rankingId}-`)) {
        this.statsCache.delete(key);
        logger.cache('Stats cache invalidated V2', key);
      }
    }
  }

  // Invalidar cache de um usuário específico
  invalidateUser(rankingId: string, userId: string): void {
    // Remover estatísticas do usuário
    const statsKey = this.getStatsKey(rankingId, userId);
    this.statsCache.delete(statsKey);
    logger.cache('User stats cache invalidated V2', statsKey);

    // Invalidar rankings (pois a posição pode ter mudado)
    this.invalidateRanking(rankingId);
  }

  // Limpar todo o cache
  clearAll(): void {
    this.rankingsCache.clear();
    this.rankingDataCache.clear();
    this.statsCache.clear();
    logger.cache('All cache cleared V2');
  }

  // Obter estatísticas do cache
  getCacheStats(): {
    rankingsCount: number;
    rankingDataCount: number;
    statsCount: number;
    totalSize: number;
  } {
    this.cleanExpiredCache();
    
    return {
      rankingsCount: this.rankingsCache.size,
      rankingDataCount: this.rankingDataCache.size,
      statsCount: this.statsCache.size,
      totalSize: this.rankingsCache.size + this.rankingDataCache.size + this.statsCache.size
    };
  }

  // Pré-carregar dados importantes
  async preloadRankingData(rankingId: string, pages: number[] = [1], limit: number = 100): Promise<void> {
    try {
      logger.cache('Preloading ranking data V2', `rankingId: ${rankingId}, pages: ${pages.join(',')}`);
      
      // Aqui você pode implementar lógica para pré-carregar dados
      // Por exemplo, buscar rankings de páginas específicas
      
      logger.cache('Ranking data preloaded V2', `rankingId: ${rankingId}`);
    } catch (error) {
      logger.error('Error preloading ranking data V2', 'RANKING_CACHE_V2', error);
    }
  }
}

// Instância singleton do cache
export const rankingCacheV2 = new RankingCacheV2();

// Funções de conveniência para compatibilidade
export const getRankings = (rankingId: string, page: number, limit: number, reservationType?: string) => {
  return rankingCacheV2.getRankings(rankingId, page, limit, reservationType);
};

export const setRankings = (rankingId: string, data: any[], page: number, limit: number, reservationType?: string) => {
  return rankingCacheV2.setRankings(rankingId, data, page, limit, reservationType);
};

export const getRankingData = (rankingId: string) => {
  return rankingCacheV2.getRankingData(rankingId);
};

export const setRankingData = (rankingId: string, data: any) => {
  return rankingCacheV2.setRankingData(rankingId, data);
};

export const getStats = (rankingId: string, userId?: string) => {
  return rankingCacheV2.getStats(rankingId, userId);
};

export const setStats = (rankingId: string, data: any, userId?: string) => {
  return rankingCacheV2.setStats(rankingId, data, userId);
};

export const invalidateRanking = (rankingId: string) => {
  return rankingCacheV2.invalidateRanking(rankingId);
};

export const invalidateUser = (rankingId: string, userId: string) => {
  return rankingCacheV2.invalidateUser(rankingId, userId);
};

export const clearAllCache = () => {
  return rankingCacheV2.clearAll();
};

export const getCacheStats = () => {
  return rankingCacheV2.getCacheStats();
};












