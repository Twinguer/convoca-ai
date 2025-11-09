// @ts-nocheck

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { rankingCache } from './rankingCache';
import { buildRankingFromConsolidated } from './rankingFormatting';

// Defining the Ranking interface to fix TypeScript errors
export interface Ranking {
  position: number;
  name: string;
  score: number;
  userId: string;
  avatarUrl?: string | null;
  // Pontuações subjetivas
  discursiveScore?: number | null;
  caseStudy1Score?: number | null;
  caseStudy2Score?: number | null;
  caseStudy3Score?: number | null;
  otherSubjectiveScore?: number | null;
  // Pontuações subjetivas com peso
  weightedDiscursiveScore?: number | null;
  weightedCaseStudy1Score?: number | null;
  weightedCaseStudy2Score?: number | null;
  weightedCaseStudy3Score?: number | null;
  weightedOtherSubjectiveScore?: number | null;
  // Pontuações de disciplinas customizadas
  customDisciplineScores?: { [key: string]: number };
  weightedCustomDisciplineScores?: { [key: string]: number };
  // Flags de mínimos não atingidos
  belowMinimum?: boolean;
  belowDisciplineMinimums?: string[];
  belowBlockMinimums?: string[];
  // Campos adicionais
  reservationType: string;
  displayReservation?: string;
  id: string;
  quotaPosition?: number; // Posição dentro da cota - será calculado em runtime
}

// Helper function to get abbreviation for reservation type
const getReservationAbbreviation = (reservationType: string): string => {
  if (!reservationType || reservationType === 'Ampla Concorrência') return '';
  
  // Get first three letters as abbreviation
  const abbr = reservationType.substring(0, 3).toUpperCase();
  return abbr;
};

export const fetchUserRankings = async (
  concursoId: string,
  reservationType?: string,
  offset = 0,
  limit = 100
): Promise<Ranking[]> => {
  const startTime = performance.now();
  const page = Math.floor(offset / limit) + 1;

  try {
    logger.ranking('Fetching rankings', `concursoId: ${concursoId}, page: ${page}, limit: ${limit}`);

    // Verificar cache local primeiro
    const localCachedRankings = rankingCache.getRankings(concursoId, page, limit);
    
    if (localCachedRankings) {
      logger.ranking('Rankings loaded from local cache', `concursoId: ${concursoId}, page: ${page}, count: ${localCachedRankings.length}`);
      
      const endTime = performance.now();
      logger.performance('fetchUserRankings (local cached)', endTime - startTime, 'RANKING_SERVICE');
      
      return localCachedRankings;
    }
    
    // Query usando função RPC para buscar rankings (acesso público)
    logger.ranking('Executing ranking query V2 (RPC)', `rankingId: ${concursoId}, offset: ${offset}, limit: ${limit}`);
    
    // Usar função RPC que retorna rankings do concurso (acesso público)
    const { data: allUserRankings, error: rankingError } = await supabase.rpc('get_rankings_for_concurso', {
      p_concurso_id: concursoId,
      p_reservation_type: reservationType || null,
      p_offset: offset,
      p_limit: limit
    });

    if (rankingError) {
      logger.error('Error calling get_rankings_for_concurso', 'RANKING_SERVICE', rankingError);
      throw new Error(`Ranking query error: ${rankingError.message}`);
    }

    // Filter and format rankings for the specific concurso
    const rankingData = [];
    if (allUserRankings) {
      // Get user IDs for profile lookup
      const userIds = allUserRankings.map(ur => ur.user_id);
      
      // Fetch user profiles separately
      const { data: userProfiles, error: profileError } = await supabase
        .from('users_profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);
      
      // Debug logs removed for security
      
      // Create a map for quick profile lookup
      const profileMap = new Map();
      if (userProfiles && userProfiles.length > 0) {
        userProfiles.forEach(profile => {
          profileMap.set(profile.id, profile);
        });
      }
      
      // Se não encontrou todos os perfis, buscar individualmente
      if (profileMap.size < userIds.length) {
        console.warn(`Found ${profileMap.size} profiles out of ${userIds.length}, searching for missing ones...`);
        for (const userId of userIds) {
          if (!profileMap.has(userId)) {
            try {
              const { data: individualProfile } = await supabase
                .from('users_profiles')
                .select('id, name, avatar_url')
                .eq('id', userId)
                .single();
              
              if (individualProfile) {
                profileMap.set(userId, individualProfile);
                // Debug logs removed for security
              } else {
                console.warn(`No profile found for ${userId}`);
              }
            } catch (err) {
              console.warn(`Failed to fetch individual profile for ${userId}:`, err);
            }
          }
        }
      }
      
      // Debug logs removed for security
      
      // Process rankings sequentially to handle async operations
      for (const userRanking of allUserRankings) {
        if (userRanking.consolidated_data?.rankings) {
          for (const [rankingId, rankingDataItem] of Object.entries(userRanking.consolidated_data.rankings)) {
            // Debug logs removed for security
            
            if (rankingDataItem.concurso_id === concursoId) {
              const userProfile = profileMap.get(userRanking.user_id);
              
              if (!userProfile) {
                console.error(`CRITICAL: Profile not found for user ${userRanking.user_id}`);
                console.error('Available profiles:', Array.from(profileMap.keys()));
                console.error('Looking for:', userRanking.user_id);
                continue; // Skip this ranking if no profile found
              }
              
              // Debug logs removed for security
              
              // Debug logs removed for security

              // Debug logs removed for security

              // Debug logs removed for security

              rankingData.push(
                buildRankingFromConsolidated(
                  rankingId,
                  userRanking.user_id,
                  rankingDataItem.user_data,
                  userProfile.name,
                  userProfile.avatar_url,
                  getReservationAbbreviation
                )
              );
            }
          }
        }
      }
    }

    // ✅ Ordenar rankings: classificados por score decrescente primeiro, depois eliminados por score decrescente
    // Isso garante que classificados sempre aparecem antes de eliminados, independente do score
    rankingData.sort((a, b) => {
      const aScore = Number(a.score || 0);
      const bScore = Number(b.score || 0);
      const aEliminated = !!(a.belowMinimum || (a.belowDisciplineMinimums && a.belowDisciplineMinimums.length > 0) || (a.belowBlockMinimums && a.belowBlockMinimums.length > 0));
      const bEliminated = !!(b.belowMinimum || (b.belowDisciplineMinimums && b.belowDisciplineMinimums.length > 0) || (b.belowBlockMinimums && b.belowBlockMinimums.length > 0));
      
      // Se um é eliminado e outro não, eliminado vai para o final
      if (aEliminated && !bEliminated) return 1;
      if (!aEliminated && bEliminated) return -1;
      
      // Se ambos têm o mesmo status (ambos classificados ou ambos eliminados), ordenar por score decrescente
      // Em caso de empate, manter ordem original (estável)
      if (bScore !== aScore) {
        return bScore - aScore;
      }
      
      // Empate: ordenar por userId para garantir ordem estável
      return (a.userId || '').localeCompare(b.userId || '');
    });
    
    // ✅ Calcular posições usando função do backend (mais eficiente e consistente)
    let positionsMap: Record<string, Record<string, { position: number; quotaPosition?: number }>> = {};
    try {
      const { data: positionsData, error: positionsError } = await supabase.rpc('calculate_ranking_positions', {
        p_concurso_id: concursoId
      });
      
      if (!positionsError && positionsData) {
        positionsMap = positionsData;
      }
    } catch (err) {
      console.warn('Failed to fetch positions from backend, falling back to frontend calculation:', err);
      // Fallback: calcular no frontend se backend falhar
      const quotaGroups: { [key: string]: typeof rankingData } = {};
      rankingData.forEach(ranking => {
        const quota = ranking.reservationType || 'Ampla Concorrência';
        if (!quotaGroups[quota]) {
          quotaGroups[quota] = [];
        }
        quotaGroups[quota].push(ranking);
      });
      
      Object.keys(quotaGroups).forEach(quota => {
        const quotaRankings = quotaGroups[quota];
        const quotaClassified = quotaRankings.filter(r => {
          const eliminated = !!(r.belowMinimum || (r.belowDisciplineMinimums && r.belowDisciplineMinimums.length > 0) || (r.belowBlockMinimums && r.belowBlockMinimums.length > 0));
          return !eliminated;
        });
        
        quotaClassified.forEach((ranking, index) => {
          if (!positionsMap[ranking.userId]) {
            positionsMap[ranking.userId] = {};
          }
          if (!positionsMap[ranking.userId][ranking.id]) {
            positionsMap[ranking.userId][ranking.id] = { position: 0 };
          }
          positionsMap[ranking.userId][ranking.id].quotaPosition = index + 1;
        });
      });
    }
    
    // Aplicar posições do mapa aos rankings
    rankingData.forEach((ranking, index) => {
      const positions = positionsMap[ranking.userId]?.[ranking.id];
      if (positions) {
        ranking.quotaPosition = positions.quotaPosition;
        // position será calculado no pagination abaixo
      }
    });
    
    const paginatedData = rankingData.slice(offset, offset + limit);

    logger.ranking('Query result', `data: ${paginatedData?.length || 0} records, error: ${rankingError?.message || 'none'}`);

    if (rankingError) {
      throw new Error(`Ranking query error: ${rankingError.message}`);
    }

    if (!paginatedData || paginatedData.length === 0) {
      logger.ranking('No rankings found', `concursoId: ${concursoId}`);
      return [];
    }

    // Buscar dados do ranking (nova estrutura)
    const { data: rankingInfo, error: rankingInfoError } = await supabase
      .from('concursos')
      .select('id, subjects')
      .eq('id', concursoId)
      .single();

    if (rankingInfoError) {
      logger.warn('Could not fetch ranking data', 'RANKING_SERVICE', rankingInfoError);
    }

    // Obter dados do ranking
    const subjects = rankingInfo?.subjects || {};
    const hasMinimumScoreEnabled = subjects.discr || subjects.case1 || subjects.case2 || subjects.case3 || subjects.other;
    const totalMinimumScore = hasMinimumScoreEnabled ? (subjects.discr_min_score || subjects.case1_min_score || subjects.case2_min_score || subjects.case3_min_score || subjects.other_min_score || 0) : 0;

    // Formatar os dados do ranking com posições (nova estrutura normalizada)
    // Posições devem ser calculadas considerando TODOS os rankings (não apenas paginados)
    const totalRankings = rankingData.length;
    const formattedRankings = paginatedData.map((ranking, index) => {
      const name = ranking.name || 'Usuário Anônimo';
      const avatarUrl = ranking.avatarUrl || null;
      
      // Usar flags calculados no recálculo (consolidated_data)
      const belowMinimum = !!ranking.belowMinimum;
      const belowDisciplineMinimums = ranking.belowDisciplineMinimums || [];
      const belowBlockMinimums = ranking.belowBlockMinimums || [];
    
      // ✅ Usar posição do backend se disponível, caso contrário calcular localmente
      const backendPosition = positionsMap[ranking.userId]?.[ranking.id]?.position;
      const position = backendPosition ? backendPosition : (offset + index + 1);
    
      return {
        position, // Posição correta após ordenação
        name: name,
        score: ranking.score || 0,
        userId: ranking.userId,
        avatarUrl: avatarUrl,
        // Pontuações subjetivas (da nova estrutura)
        discursiveScore: ranking.discursiveScore || 0,
        caseStudy1Score: ranking.caseStudy1Score || 0,
        caseStudy2Score: ranking.caseStudy2Score || 0,
        caseStudy3Score: ranking.caseStudy3Score || 0,
        otherSubjectiveScore: ranking.otherSubjectiveScore || 0,
        // Pontuações subjetivas com peso (da nova estrutura)
        weightedDiscursiveScore: ranking.weightedDiscursiveScore || 0,
        weightedCaseStudy1Score: ranking.weightedCaseStudy1Score || 0,
        weightedCaseStudy2Score: ranking.weightedCaseStudy2Score || 0,
        weightedCaseStudy3Score: ranking.weightedCaseStudy3Score || 0,
        weightedOtherSubjectiveScore: ranking.weightedOtherSubjectiveScore || 0,
        // Pontuações de disciplinas customizadas
        customDisciplineScores: ranking.customDisciplineScores || {},
        weightedCustomDisciplineScores: ranking.weightedCustomDisciplineScores || {},
        // Flags de mínimos não atingidos (vindo do consolidated_data)
        belowMinimum,
        belowDisciplineMinimums,
        belowBlockMinimums,
        // Dados do ranking
        reservationType: ranking.reservationType,
        displayReservation: getReservationAbbreviation(ranking.reservationType),
        quotaPosition: ranking.quotaPosition || undefined, // Preservar quotaPosition calculado acima
        id: ranking.id,
      };
    });
        
    // Armazenar no cache local
    rankingCache.setRankings(concursoId, formattedRankings, page, limit);
    
    const endTime = performance.now();
    logger.performance('fetchUserRankings', endTime - startTime, 'RANKING_SERVICE');
    
    return formattedRankings;
    
  } catch (error) {
    logger.error('Error fetching rankings', 'RANKING_SERVICE', error);
    
    // Tentar cache local como fallback
    const fallbackRankings = rankingCache.getRankings(concursoId, page, limit);
    if (fallbackRankings) {
      return fallbackRankings;
    }
    
    return [];
  }
};


// Get the available reservation types for a concurso
export const getAvailableReservationTypes = async (concursoId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('concursos')
      .select(`
        has_ampla_concorrencia,
        has_ppp,
        has_pcd,
        has_hipossuficientes,
        has_indigenas,
        has_transsexuais
      `)
      .eq('id', concursoId)
      .single();
    
    if (error) {
      console.error('Error fetching concurso reservation types:', error);
      return ['Ampla Concorrência'];
    }
    
    const types = [];
    
    // Ampla Concorrência is always available
    types.push('Ampla Concorrência');
    
    if (data.has_ppp) types.push('PPP');
    if (data.has_pcd) types.push('PCD');
    if (data.has_hipossuficientes) types.push('Hipossuficientes');
    if (data.has_indigenas) types.push('Indígenas');
    if (data.has_transsexuais) types.push('Pessoas Trans');
    
    return types;
  } catch (error) {
    console.error('Error determining available reservation types:', error);
    return ['Ampla Concorrência'];
  }
};
