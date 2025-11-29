// @ts-nocheck
/**
 * ✅ CONSOLIDADO: Serviço único de rankings
 * 
 * Este arquivo consolida as funcionalidades de rankingService.ts (V1),
 * rankingServiceV2.ts e rankingServiceV3.ts em uma única implementação.
 * 
 * Características:
 * - Usa RPCs para segurança e performance
 * - Interface única e consistente
 * - Cache otimizado com suporte a reservationType
 */
import { supabase } from '@/integrations/supabase/client';
import { getReservationAbbreviation, normalizeReservationType } from '@/utils/quotaNormalization';
import { logger } from '@/utils/logger';
import { rankingCache } from './rankingCache';

// ✅ Interface única consolidada (anteriormente RankingV3)
export interface Ranking {
  id: string;
  position: number;
  name: string;
  score: number;
  userId: string;
  avatarUrl?: string;
  reservationType: string;
  displayReservation: string;
  discursiveScore?: number;
  caseStudy1Score?: number;
  caseStudy2Score?: number;
  caseStudy3Score?: number;
  otherSubjectiveScore?: number;
  weightedDiscursiveScore?: number;
  weightedCaseStudy1Score?: number;
  weightedCaseStudy2Score?: number;
  weightedCaseStudy3Score?: number;
  weightedOtherSubjectiveScore?: number;
  customDisciplineScores?: Record<string, number>;
  weightedCustomDisciplineScores?: Record<string, number>;
  belowMinimum?: boolean;
  belowDisciplineMinimums?: string[];
  belowBlockMinimums?: string[];
}

// ✅ Interface consolidada (anteriormente RankingDataV3)
export interface RankingData {
  id: string;
  titulo: string;
  orgao: string;
  banca: string;
  total_participants: number;
  created_at: string;
  exam_type: string;
  disciplines?: any[];
  official_answers?: Record<string, any>;
}

/**
 * Busca rankings de forma otimizada usando JOINs nativos do Supabase
 * @param concursoId ID do concurso
 * @param reservationType Tipo de reserva (opcional)
 * @param offset Offset para paginação
 * @param limit Limite de resultados
 */
// ✅ Função principal consolidada (anteriormente fetchUserRankingsV3)
export const fetchUserRankings = async (
  concursoId: string,
  reservationType?: string,
  offset = 0,
  limit = 100
): Promise<Ranking[]> => {
  const startTime = performance.now();
  
  // ✅ LOG INICIAL FORÇADO - deve aparecer sempre
  console.log('🚀 [RANKING_SERVICE] ========== INÍCIO fetchUserRankings ==========');
  console.log('🚀 [RANKING_SERVICE] Parâmetros:', {
    concursoId,
    reservationType,
    offset,
    limit,
    timestamp: new Date().toISOString()
  });

  try {
    // ✅ Verificar se concursoId é válido
    if (!concursoId) {
      console.error('❌ [RANKING_SERVICE] concursoId é inválido ou vazio');
      throw new Error('concursoId é obrigatório');
    }

    logger.info('fetchUserRankings called', 'RANKING_SERVICE', {
      concursoId,
      reservationType,
      offset,
      limit
    });

    const page = Math.floor(offset / limit) + 1;

    // ✅ FORÇAR LIMPEZA DO CACHE TEMPORARIAMENTE PARA DEBUG
    // TODO: Remover após corrigir o problema
    rankingCache.invalidateRanking(concursoId);
    console.log('🧹 [RANKING_SERVICE] Cache invalidado para debug');

    // Verificar cache local primeiro
    const localCachedRankings = rankingCache.getRankings(concursoId, page, limit, reservationType);
    
    if (localCachedRankings && localCachedRankings.length > 0) {
      // ✅ CORREÇÃO: Verificar se os dados do cache têm os campos necessários
      // Se não tiverem weightedCustomDisciplineScores, invalidar o cache
      const hasWeightedScores = localCachedRankings.some(r => 
        r.weightedCustomDisciplineScores && Object.keys(r.weightedCustomDisciplineScores).length > 0
      );
      
      if (!hasWeightedScores && localCachedRankings.length > 0) {
        // Cache antigo sem os campos necessários, invalidar
        console.warn('⚠️ [RANKING_SERVICE] Cache inválido detectado (sem weightedCustomDisciplineScores), invalidando');
        logger.warn('Cache inválido detectado (sem weightedCustomDisciplineScores), invalidando', 'RANKING_SERVICE');
        rankingCache.invalidateRanking(concursoId);
        // Continuar para buscar dados frescos
      } else {
        console.log('✅ [RANKING_SERVICE] Usando cache válido com weightedCustomDisciplineScores');
        logger.ranking('Rankings loaded from local cache V3', `concursoId: ${concursoId}, page: ${page}, count: ${localCachedRankings.length}`);
        
        const endTime = performance.now();
        logger.performance('fetchUserRankings (local cached)', endTime - startTime, 'RANKING_SERVICE');
        
        return localCachedRankings as Ranking[];
      }
    }

    // ✅ FASE 2: Migrar para usar RPC em vez de query direta
    // Usar função RPC que retorna rankings do concurso (acesso público)
    console.log('📡 [RANKING_SERVICE] ========== CHAMANDO RPC ==========');
    console.log('📡 [RANKING_SERVICE] Parâmetros do RPC:', {
      p_concurso_id: concursoId,
      p_reservation_type: reservationType || null,
      p_offset: offset,
      p_limit: limit
    });
    
    // ✅ Verificar se supabase está disponível
    if (!supabase) {
      console.error('❌ [RANKING_SERVICE] Supabase client não está disponível');
      throw new Error('Supabase client não está disponível');
    }

    let allUserRankings: any = null;
    let rankingError: any = null;

    try {
      const rpcResult = await supabase.rpc('get_rankings_for_concurso', {
        p_concurso_id: concursoId,
        p_reservation_type: reservationType || null,
        p_offset: offset,
        p_limit: limit
      });
      
      allUserRankings = rpcResult.data;
      rankingError = rpcResult.error;
      
      console.log('📡 [RANKING_SERVICE] RPC executado:', {
        hasData: !!allUserRankings,
        hasError: !!rankingError,
        dataLength: allUserRankings?.length || 0,
        dataType: Array.isArray(allUserRankings) ? 'array' : typeof allUserRankings,
        errorCode: rankingError?.code,
        errorMessage: rankingError?.message
      });
    } catch (rpcException) {
      console.error('❌ [RANKING_SERVICE] Exceção ao chamar RPC:', rpcException);
      rankingError = rpcException;
    }

    if (rankingError) {
      console.error('❌ [RANKING_SERVICE] ========== ERRO NO RPC ==========');
      console.error('❌ [RANKING_SERVICE] Erro completo:', {
        code: rankingError.code,
        message: rankingError.message,
        details: rankingError.details,
        hint: rankingError.hint,
        error: rankingError
      });
      logger.error('Error calling get_rankings_for_concurso V3', 'RANKING_SERVICE_V3', rankingError);
      throw new Error(`Ranking query error: ${rankingError.message || 'Erro desconhecido ao chamar RPC'}`);
    }
    
    console.log('✅ [RANKING_SERVICE] RPC retornou com sucesso:', {
      hasData: !!allUserRankings,
      dataLength: allUserRankings?.length || 0,
      dataType: Array.isArray(allUserRankings) ? 'array' : typeof allUserRankings,
      firstItem: allUserRankings?.[0] ? {
        user_id: allUserRankings[0].user_id,
        hasConsolidatedData: !!allUserRankings[0].consolidated_data
      } : null
    });

    if (!allUserRankings || allUserRankings.length === 0) {
      console.log('⚠️ [RANKING_SERVICE] Nenhum ranking retornado do RPC');
      return [];
    }

    console.log('📊 [RANKING_SERVICE] Dados brutos do RPC:', {
      totalItems: allUserRankings.length,
      sampleItem: allUserRankings[0] ? {
        user_id: allUserRankings[0].user_id,
        hasConsolidatedData: !!allUserRankings[0].consolidated_data,
        consolidatedDataKeys: allUserRankings[0].consolidated_data ? Object.keys(allUserRankings[0].consolidated_data) : []
      } : null
    });

    // Processar consolidated_data para extrair rankings do concurso específico
    const rankingsForConcurso = [];
    
    for (const item of allUserRankings) {
      // ✅ CORREÇÃO: Garantir que consolidated_data seja um objeto
      let consolidatedData = item.consolidated_data;
      
      // Se for string (pode acontecer com JSONB), fazer parse
      if (typeof consolidatedData === 'string') {
        try {
          consolidatedData = JSON.parse(consolidatedData);
        } catch (e) {
          console.error('❌ [RANKING_SERVICE] Erro ao fazer parse de consolidated_data:', e);
          continue;
        }
      }
      
      consolidatedData = consolidatedData || {};
      
      if (consolidatedData.rankings) {
        // Encontrar o ranking específico deste concurso
        for (const [rankingId, ranking] of Object.entries(consolidatedData.rankings)) {
          const rankingConcursoId = (ranking as any).concurso_id;
          
          // ✅ DEBUG: Log da comparação
          if (rankingsForConcurso.length === 0) {
            console.log('🔍 [RANKING_SERVICE] Comparando concurso_id:', {
              rankingConcursoId,
              targetConcursoId: concursoId,
              match: rankingConcursoId === concursoId,
              rankingType: typeof ranking,
              rankingIsObject: typeof ranking === 'object',
              rankingKeys: Object.keys(ranking || {}),
              hasUserData: !!(ranking as any).user_data,
              userDataKeys: (ranking as any).user_data ? Object.keys((ranking as any).user_data).slice(0, 10) : []
            });
          }
          
          // ✅ CORREÇÃO: Comparar como string para evitar problemas de tipo UUID
          if (String(rankingConcursoId) === String(concursoId)) {
            rankingsForConcurso.push({
              user_id: item.user_id,
              rankingId,
              rankingData: ranking
            });
            break; // Apenas um ranking por concurso por usuário
          }
        }
      } else {
        console.log('⚠️ [RANKING_SERVICE] consolidatedData não tem rankings:', {
          user_id: item.user_id,
          consolidatedDataType: typeof consolidatedData,
          consolidatedDataKeys: Object.keys(consolidatedData),
          consolidatedDataIsArray: Array.isArray(consolidatedData)
        });
      }
    }

    console.log('✅ [RANKING_SERVICE] Rankings encontrados para o concurso:', {
      total: rankingsForConcurso.length,
      sampleRanking: rankingsForConcurso[0] ? {
        user_id: rankingsForConcurso[0].user_id,
        rankingId: rankingsForConcurso[0].rankingId,
        rankingDataKeys: Object.keys(rankingsForConcurso[0].rankingData || {}),
        hasUserData: !!(rankingsForConcurso[0].rankingData as any)?.user_data
      } : null
    });

    // Ordenar por score (descendente)
    rankingsForConcurso.sort((a, b) => {
      const scoreA = (a.rankingData as any).user_data?.score || 0;
      const scoreB = (b.rankingData as any).user_data?.score || 0;
      return scoreB - scoreA;
    });

    // Buscar perfis de usuários separadamente (RPC não retorna perfis)
    const userIds = [...new Set(rankingsForConcurso.map((item: any) => item.user_id))];
    
    const { data: userProfiles, error: profileError } = await supabase
      .from('users_profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);

    if (profileError) {
      logger.error('Error fetching user profiles V3', 'RANKING_SERVICE_V3', profileError);
      // Continuar mesmo sem perfis (usar valores padrão)
    }

    // Criar mapa de perfis para lookup rápido
    const profileMap = new Map();
    if (userProfiles) {
      userProfiles.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
    }

    // Mapear resultados para o formato esperado
    const paginatedData = rankingsForConcurso.map((item: any) => {
      const userProfile = profileMap.get(item.user_id) || { name: 'Usuário', avatar_url: null };
      return {
        user_id: item.user_id,
        rankingId: item.rankingId,
        rankingData: item.rankingData,
        users_profiles: userProfile
      };
    });

    // Mapear resultados para o formato esperado
    const rankings: Ranking[] = paginatedData.map((item: any, index: number) => {
      // RPC retorna dados já formatados, mas precisamos extrair user_data
      // item.rankingData já é o objeto ranking de consolidated_data->rankings->[rankingId]
      const rankingData = item.rankingData || item;
      
      // ✅ DEBUG DETALHADO: Verificar estrutura completa
      if (index === 0) {
        console.log('🔍 [RANKING_SERVICE] rankingData structure (PRIMEIRO ITEM):', {
          itemKeys: Object.keys(item),
          rankingDataKeys: Object.keys(rankingData || {}),
          hasUserData: !!rankingData?.user_data,
          rankingDataType: typeof rankingData,
          rankingDataIsArray: Array.isArray(rankingData)
        });
      }
      
      // rankingData.user_data contém todos os dados do usuário
      const userData = rankingData?.user_data || rankingData || {};
      
      // ✅ DEBUG: Verificar se userData está vazio ou tem dados
      if (index === 0) {
        // Log completo da estrutura userData - INCLUINDO TODAS AS CHAVES
        const allUserDataKeys = Object.keys(userData);
        console.log('🔍 [RANKING_SERVICE] ========== userData COMPLETO (PRIMEIRO ITEM) ==========');
        console.log('🔍 [RANKING_SERVICE] Todas as chaves de userData:', allUserDataKeys);
        console.log('🔍 [RANKING_SERVICE] userData completo (JSON):', JSON.stringify(userData, null, 2).substring(0, 2000));
        
        // Verificar TODAS as variações possíveis do nome do campo
        console.log('🔍 [RANKING_SERVICE] Verificando campos de scores:', {
          hasWeightedCustomDisciplineScores: !!userData?.weightedCustomDisciplineScores,
          hasWeightedCustomDisciplineScoresSnake: !!userData?.weighted_custom_discipline_scores,
          hasWeightedObjectScores: !!userData?.weighted_object_scores,
          hasWeightedObjectScoresCamel: !!userData?.weightedObjectScores,
          hasObjectScores: !!userData?.object_scores,
          // Valores reais (primeiros 500 chars)
          weightedCustomDisciplineScoresValue: userData?.weightedCustomDisciplineScores ? JSON.stringify(userData.weightedCustomDisciplineScores).substring(0, 500) : null,
          weightedCustomDisciplineScoresSnakeValue: userData?.weighted_custom_discipline_scores ? JSON.stringify(userData.weighted_custom_discipline_scores).substring(0, 500) : null,
          weightedObjectScoresValue: userData?.weighted_object_scores ? JSON.stringify(userData.weighted_object_scores).substring(0, 500) : null,
          objectScoresValue: userData?.object_scores ? JSON.stringify(userData.object_scores).substring(0, 500) : null,
          // Tipos
          objectScoresType: typeof userData?.object_scores,
          weightedCustomDisciplineScoresType: typeof userData?.weightedCustomDisciplineScores,
          // Amostras
          sampleObjectScores: userData?.object_scores ? Object.keys(userData.object_scores).slice(0, 10) : null,
          sampleWeightedCustom: userData?.weightedCustomDisciplineScores ? Object.keys(userData.weightedCustomDisciplineScores).slice(0, 10) : null
        });
        
        // Verificar se há alguma chave que contenha "weighted" ou "custom" ou "discipline"
        const keysWithWeighted = allUserDataKeys.filter(k => k.toLowerCase().includes('weighted'));
        const keysWithCustom = allUserDataKeys.filter(k => k.toLowerCase().includes('custom'));
        const keysWithDiscipline = allUserDataKeys.filter(k => k.toLowerCase().includes('discipline'));
        console.log('🔍 [RANKING_SERVICE] Chaves relacionadas:', {
          keysWithWeighted,
          keysWithCustom,
          keysWithDiscipline
        });
      }
      
      // Extrair pontuações subjetivas da estrutura correta
      const subjectiveScores = userData?.subjectives || userData?.subjective_scores || {};
      const objectScores = userData?.object_scores || {};
      
      // ✅ CORREÇÃO: Extrair weightedCustomDisciplineScores ou weighted_object_scores
      // Verificar ambos os formatos (camelCase e snake_case)
      // O campo no banco é weightedCustomDisciplineScores (camelCase)
      const weightedObjectScores = userData?.weightedCustomDisciplineScores || 
                                    userData?.weighted_custom_discipline_scores ||
                                    userData?.weighted_object_scores || 
                                    userData?.weightedObjectScores || {};
      
      // ✅ CORREÇÃO: Extrair weighted_subjective_scores se disponível
      const weightedSubjectives = userData?.weighted_subjective_scores || 
                                  userData?.weightedSubjectiveScores ||
                                  userData?.weighted_subjectives || {};
      
      // ✅ DEBUG DETALHADO: Log dos dados extraídos
      if (index === 0) {
        console.log('🔍 [RANKING_SERVICE] Dados extraídos (PRIMEIRO ITEM):', {
          weightedObjectScoresKeys: Object.keys(weightedObjectScores),
          weightedObjectScoresCount: Object.keys(weightedObjectScores).length,
          objectScoresKeys: Object.keys(objectScores),
          objectScoresCount: Object.keys(objectScores).length,
          sampleWeightedObjectScores: Object.entries(weightedObjectScores).slice(0, 3),
          sampleObjectScores: Object.entries(objectScores).slice(0, 3),
          hasWeightedSubjectives: Object.keys(weightedSubjectives).length > 0,
          weightedSubjectivesKeys: Object.keys(weightedSubjectives)
        });
      }

      return {
        id: item.rankingId || rankingData?.id || `ranking-${item.user_id}-${index}`, // Usar o rankingId específico
        position: offset + index + 1,
        name: item.users_profiles?.name || 'Usuário',
        score: userData?.score || rankingData?.score || 0,
        userId: item.user_id,
        avatarUrl: item.users_profiles?.avatar_url || null,
        // ✅ CORREÇÃO: Normalizar reservation_type para garantir nomenclatura correta
        reservationType: normalizeReservationType(userData?.reservation_type || rankingData?.reservation_type || 'Ampla Concorrência'),
        displayReservation: getReservationAbbreviation(userData?.reservation_type || rankingData?.reservation_type || 'Ampla Concorrência'),
        discursiveScore: subjectiveScores.discursive || 0,
        caseStudy1Score: subjectiveScores.case_study_1 || 0,
        caseStudy2Score: subjectiveScores.case_study_2 || 0,
        caseStudy3Score: subjectiveScores.case_study_3 || 0,
        otherSubjectiveScore: subjectiveScores.other_subjective || 0,
        // ✅ CORREÇÃO: Adicionar scores ponderados das subjetivas
        weightedDiscursiveScore: Number(
          weightedSubjectives.weighted_discursive_score || 
          weightedSubjectives.weightedDiscursiveScore || 
          subjectiveScores.discursive || 0
        ),
        weightedCaseStudy1Score: Number(
          weightedSubjectives.weighted_case_study_1_score || 
          weightedSubjectives.weightedCaseStudy1Score || 
          subjectiveScores.case_study_1 || 0
        ),
        weightedCaseStudy2Score: Number(
          weightedSubjectives.weighted_case_study_2_score || 
          weightedSubjectives.weightedCaseStudy2Score || 
          subjectiveScores.case_study_2 || 0
        ),
        weightedCaseStudy3Score: Number(
          weightedSubjectives.weighted_case_study_3_score || 
          weightedSubjectives.weightedCaseStudy3Score || 
          subjectiveScores.case_study_3 || 0
        ),
        weightedOtherSubjectiveScore: Number(
          weightedSubjectives.weighted_other_subjective_score || 
          weightedSubjectives.weightedOtherSubjectiveScore || 
          subjectiveScores.other_subjective || 0
        ),
        // ✅ CORREÇÃO: Usar objectScores filtrado para customDisciplineScores
        customDisciplineScores: Object.fromEntries(
          Object.entries(objectScores).filter(([k]) => k.startsWith('custom_'))
        ),
        // ✅ CORREÇÃO: Usar weightedCustomDisciplineScores ou weighted_object_scores
        // Se weightedObjectScores já contém apenas chaves custom_, usar diretamente
        // Caso contrário, filtrar apenas as que começam com custom_
        weightedCustomDisciplineScores: (() => {
          // ✅ DEBUG: Log detalhado da criação de weightedCustomDisciplineScores
          if (index === 0) {
            console.log('🔍 [RANKING_SERVICE] ========== Criando weightedCustomDisciplineScores ==========');
            console.log('🔍 [RANKING_SERVICE] weightedObjectScores completo:', JSON.stringify(weightedObjectScores, null, 2));
            console.log('🔍 [RANKING_SERVICE] objectScores completo:', JSON.stringify(objectScores, null, 2));
            console.log('🔍 [RANKING_SERVICE] Análise:', {
              weightedObjectScoresKeys: Object.keys(weightedObjectScores),
              weightedObjectScoresLength: Object.keys(weightedObjectScores).length,
              objectScoresKeys: Object.keys(objectScores),
              objectScoresLength: Object.keys(objectScores).length,
              objectScoresCustomKeys: Object.keys(objectScores).filter(k => k.startsWith('custom_')),
              weightedObjectScoresCustomKeys: Object.keys(weightedObjectScores).filter(k => k.startsWith('custom_')),
              // Verificar TODAS as chaves que não começam com custom_ mas podem ser disciplinas
              allWeightedKeys: Object.keys(weightedObjectScores),
              allObjectKeys: Object.keys(objectScores)
            });
          }
          
          if (Object.keys(weightedObjectScores).length > 0) {
            // ✅ CORREÇÃO: Usar TODOS os dados diretamente, sem filtro
            // O backend já salva apenas as disciplinas customizadas em weightedCustomDisciplineScores
            if (index === 0) {
              console.log('✅ [RANKING_SERVICE] Usando weightedObjectScores completo (SEM FILTRO):', {
                keys: Object.keys(weightedObjectScores),
                count: Object.keys(weightedObjectScores).length,
                sample: Object.entries(weightedObjectScores).slice(0, 3)
              });
            }
            return weightedObjectScores; // ✅ Retornar TODOS os dados, sem filtro
          }
          // Fallback: se não houver weighted scores, usar object_scores (sem peso)
          const fallback = Object.fromEntries(
            Object.entries(objectScores).filter(([k]) => k.startsWith('custom_'))
          );
          if (index === 0) {
            console.log('⚠️ [RANKING_SERVICE] Usando fallback (object_scores filtrado):', {
              fallbackKeys: Object.keys(fallback),
              fallbackLength: Object.keys(fallback).length,
              fallbackValues: fallback
            });
          }
          // ✅ CORREÇÃO: Se o fallback resultou em vazio mas há objectScores, usar TODOS
          if (Object.keys(fallback).length === 0 && Object.keys(objectScores).length > 0) {
            if (index === 0) {
              console.log('⚠️ [RANKING_SERVICE] Fallback resultou vazio, usando TODOS os objectScores');
            }
            return objectScores;
          }
          return fallback;
        })(),
        belowMinimum: !!(userData?.belowMinimum || userData?.below_minimum),
        belowDisciplineMinimums: userData?.belowDisciplineMinimums || userData?.below_discipline_minimums || [],
        belowBlockMinimums: userData?.belowBlockMinimums || userData?.below_block_minimums || [],
      };
    });

    // ✅ DEBUG: Verificar dados finais antes de retornar
    if (rankings.length > 0) {
      console.log('✅ [RANKING_SERVICE] Rankings mapeados (PRIMEIRO ITEM - FINAL):', {
        totalRankings: rankings.length,
        firstRanking: {
          id: rankings[0].id,
          name: rankings[0].name,
          score: rankings[0].score,
          hasWeightedCustomDisciplineScores: !!rankings[0].weightedCustomDisciplineScores,
          weightedCustomDisciplineScoresKeys: rankings[0].weightedCustomDisciplineScores ? Object.keys(rankings[0].weightedCustomDisciplineScores) : [],
          weightedCustomDisciplineScoresCount: rankings[0].weightedCustomDisciplineScores ? Object.keys(rankings[0].weightedCustomDisciplineScores).length : 0,
          sampleWeightedCustomScores: rankings[0].weightedCustomDisciplineScores ? Object.entries(rankings[0].weightedCustomDisciplineScores).slice(0, 3) : null,
          hasCustomDisciplineScores: !!rankings[0].customDisciplineScores,
          customDisciplineScoresKeys: rankings[0].customDisciplineScores ? Object.keys(rankings[0].customDisciplineScores) : []
        }
      });
    }
    
    // ✅ CORREÇÃO: Verificar se os rankings têm os campos necessários antes de salvar no cache
    // Garantir que pelo menos alguns rankings tenham weightedCustomDisciplineScores
    const rankingsWithScores = rankings.filter(r => 
      r.weightedCustomDisciplineScores && Object.keys(r.weightedCustomDisciplineScores).length > 0
    );
    
    if (rankings.length > 0 && rankingsWithScores.length === 0) {
      console.warn('⚠️ [RANKING_SERVICE] Nenhum ranking tem weightedCustomDisciplineScores válido');
      console.warn('⚠️ [RANKING_SERVICE] Verificando estrutura dos dados:', {
        sampleRanking: rankings[0] ? {
          allKeys: Object.keys(rankings[0]),
          hasCustomDisciplineScores: !!rankings[0].customDisciplineScores,
          customDisciplineScoresKeys: rankings[0].customDisciplineScores ? Object.keys(rankings[0].customDisciplineScores) : []
        } : null
      });
    }
    
    logger.info('Rankings mapeados', 'RANKING_SERVICE', {
      total: rankings.length,
      withWeightedScores: rankingsWithScores.length,
      sampleWeightedScores: rankings[0]?.weightedCustomDisciplineScores || {}
    });
    
    // Armazenar no cache local apenas se os dados estiverem completos
    rankingCache.setRankings(concursoId, rankings, page, limit, reservationType);

    const duration = performance.now() - startTime;
    logger.performance('fetchUserRankings completed', duration, 'RANKING_SERVICE', {
      count: rankings.length,
      offset,
      limit
    });

    return rankings;
  } catch (error: any) {
    console.error('❌ [RANKING_SERVICE] ========== ERRO GERAL ==========');
    console.error('❌ [RANKING_SERVICE] Erro capturado:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      error: error
    });
    logger.error('Error in fetchUserRankings', 'RANKING_SERVICE', error);
    throw error;
  } finally {
    const endTime = performance.now();
    console.log('🏁 [RANKING_SERVICE] ========== FIM fetchUserRankings ==========');
    console.log('🏁 [RANKING_SERVICE] Tempo de execução:', `${(endTime - startTime).toFixed(2)}ms`);
  }
};

/**
 * Busca dados do ranking (concurso)
 */
// ✅ Função consolidada (anteriormente fetchRankingDataV3)
export const fetchRankingData = async (concursoId: string): Promise<RankingData | null> => {
  try {
    const { data, error } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();

    if (error) {
      logger.error('Error fetching ranking data V3', 'RANKING_SERVICE_V3', error);
      throw error;
    }

    return data as RankingData;
  } catch (error) {
    logger.error('Error in fetchRankingData', 'RANKING_SERVICE', error);
    return null;
  }
};

/**
 * Busca disciplinas do ranking
 */
// ✅ Função consolidada (anteriormente fetchRankingDisciplinesV3)
export const fetchRankingDisciplines = async (concursoId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('concursos')
      .select('disciplines')
      .eq('id', concursoId)
      .single();

    if (error) {
      logger.error('Error fetching disciplines', 'RANKING_SERVICE', error);
      throw error;
    }

    return data?.disciplines || [];
  } catch (error) {
    logger.error('Error in fetchRankingDisciplines', 'RANKING_SERVICE', error);
    return [];
  }
};

/**
 * Busca tipos de reserva disponíveis para um ranking
 */
// ✅ Função consolidada (anteriormente getAvailableReservationTypesV3)
export const getAvailableReservationTypes = async (concursoId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('user_rankings')
      .select('consolidated_data');

    if (error) {
      logger.error('Error fetching reservation types', 'RANKING_SERVICE', error);
      throw error;
    }

    const types = new Set<string>();
    types.add('Ampla Concorrência');

    data?.forEach((item: any) => {
      const rankings = item.consolidated_data?.rankings || {};
      Object.values(rankings).forEach((ranking: any) => {
        if (ranking?.concurso_id === concursoId) {
          const type = ranking?.user_data?.reservation_type || 'Ampla Concorrência';
          types.add(type);
        }
      });
    });

    return Array.from(types);
  } catch (error) {
    logger.error('Error in getAvailableReservationTypes', 'RANKING_SERVICE', error);
    return ['Ampla Concorrência'];
  }
};

/**
 * Busca estatísticas do ranking
 */
// ✅ Função consolidada (anteriormente fetchRankingStatsV3)
export const fetchRankingStats = async (concursoId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('user_rankings')
      .select('consolidated_data');

    if (error) {
      logger.error('Error fetching stats', 'RANKING_SERVICE', error);
      throw error;
    }

    const entries: Array<{ score: number; reservation_type: string }> = [];

    data?.forEach((item: any) => {
      const rankings = item.consolidated_data?.rankings || {};
      Object.values(rankings).forEach((ranking: any) => {
        if (ranking?.concurso_id === concursoId) {
          entries.push({
            score: Number(ranking?.user_data?.score || 0),
            reservation_type: ranking?.user_data?.reservation_type || 'Ampla Concorrência'
          });
        }
      });
    });

    const totalParticipants = entries.length;
    const scores = entries.map(e => e.score);
    const avgScore = totalParticipants > 0 ? (scores.reduce((a, b) => a + b, 0) / totalParticipants) : 0;
    const maxScore = scores.length ? Math.max(...scores) : 0;
    const minScore = scores.length ? Math.min(...scores) : 0;

    const reservationTypeCount: Record<string, number> = {};
    entries.forEach(e => {
      reservationTypeCount[e.reservation_type] = (reservationTypeCount[e.reservation_type] || 0) + 1;
    });

    return {
      total_participants: totalParticipants,
      avg_score: avgScore,
      max_score: maxScore,
      min_score: minScore,
      reservation_type_count: reservationTypeCount,
    };
  } catch (error) {
    logger.error('Error in fetchRankingStats', 'RANKING_SERVICE', error);
    return null;
  }
};

/**
 * Calcula score usando Edge Function
 */
export const calculateRankingScore = async (
  userId: string,
  concursoId: string,
  answers: Record<string, string>,
  bookletId: string,
  reservationType: string,
  subjectiveScores?: {
    discursive_score?: number;
    case_study_1_score?: number;
    case_study_2_score?: number;
    case_study_3_score?: number;
    other_subjective_score?: number;
  }
): Promise<{ success: boolean; score?: number; error?: string }> => {
  try {
    logger.info('calculateRankingScore called', 'RANKING_SERVICE', {
      userId,
      concursoId,
      bookletId,
      answerCount: Object.keys(answers).length
    });

    const { data, error } = await supabase.functions.invoke('calculate-ranking-score', {
      body: {
        userId,
        concursoId,
        answers,
        bookletId,
        reservationType,
        subjectiveScores,
      },
    });

    if (error) {
      logger.error('Error calling calculate-ranking-score function', 'RANKING_SERVICE', error);
      return { success: false, error: error.message };
    }

    logger.info('Score calculated successfully', 'RANKING_SERVICE', {
      score: data.score
    });

    return { success: true, score: data.score };
  } catch (error: any) {
    logger.error('Error in calculateRankingScore', 'RANKING_SERVICE', error);
    return { success: false, error: error.message };
  }
};
