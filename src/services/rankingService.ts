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
import { devLog, sanitizeForLog } from '@/utils/productionLogger';

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
  
  // ✅ SEGURANÇA: Log sanitizado (sem dados sensíveis)
  devLog.debug('🚀 [RANKING_SERVICE] Início fetchUserRankings', {
    hasConcursoId: !!concursoId,
    hasReservationType: !!reservationType,
    offset,
    limit
  });

  try {
    // ✅ Verificar se concursoId é válido
    if (!concursoId) {
      devLog.error('❌ [RANKING_SERVICE] concursoId é inválido ou vazio');
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
    devLog.debug('🧹 [RANKING_SERVICE] Cache invalidado');

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
        devLog.warn('⚠️ [RANKING_SERVICE] Cache inválido detectado (sem weightedCustomDisciplineScores), invalidando');
        logger.warn('Cache inválido detectado (sem weightedCustomDisciplineScores), invalidando', 'RANKING_SERVICE');
        rankingCache.invalidateRanking(concursoId);
        // Continuar para buscar dados frescos
      } else {
        devLog.debug('✅ [RANKING_SERVICE] Usando cache válido');
        logger.ranking('Rankings loaded from local cache V3', `concursoId: ${concursoId}, page: ${page}, count: ${localCachedRankings.length}`);
        
        const endTime = performance.now();
        logger.performance('fetchUserRankings (local cached)', endTime - startTime, 'RANKING_SERVICE');
        
        return localCachedRankings as Ranking[];
      }
    }

    // ✅ FASE 2: Migrar para usar RPC em vez de query direta
    // Usar função RPC que retorna rankings do concurso (acesso público)
    devLog.debug('📡 [RANKING_SERVICE] Chamando RPC', {
      hasConcursoId: !!concursoId,
      hasReservationType: !!reservationType,
      offset,
      limit
    });
    
    // ✅ Verificar se supabase está disponível
    if (!supabase) {
      devLog.error('❌ [RANKING_SERVICE] Supabase client não está disponível');
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
      
      devLog.debug('📡 [RANKING_SERVICE] RPC executado', {
        hasData: !!allUserRankings,
        hasError: !!rankingError,
        dataLength: allUserRankings?.length || 0,
        dataType: Array.isArray(allUserRankings) ? 'array' : typeof allUserRankings
      });
    } catch (rpcException) {
      devLog.error('❌ [RANKING_SERVICE] Exceção ao chamar RPC', sanitizeForLog(rpcException));
      rankingError = rpcException;
    }

    if (rankingError) {
      devLog.error('❌ [RANKING_SERVICE] Erro no RPC', sanitizeForLog({
        code: rankingError.code,
        message: rankingError.message
      }));
      logger.error('Error calling get_rankings_for_concurso V3', 'RANKING_SERVICE_V3', rankingError);
      throw new Error(`Ranking query error: ${rankingError.message || 'Erro desconhecido ao chamar RPC'}`);
    }
    
    devLog.debug('✅ [RANKING_SERVICE] RPC retornou com sucesso', {
      hasData: !!allUserRankings,
      dataLength: allUserRankings?.length || 0,
      dataType: Array.isArray(allUserRankings) ? 'array' : typeof allUserRankings
    });

    if (!allUserRankings || allUserRankings.length === 0) {
      devLog.debug('⚠️ [RANKING_SERVICE] Nenhum ranking retornado do RPC');
      return [];
    }

    devLog.debug('📊 [RANKING_SERVICE] Dados do RPC (sanitizado)', {
      totalItems: allUserRankings.length,
      hasConsolidatedData: allUserRankings[0] ? !!allUserRankings[0].consolidated_data : false
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
          devLog.error('❌ [RANKING_SERVICE] Erro ao fazer parse de consolidated_data', sanitizeForLog(e));
          continue;
        }
      }
      
      consolidatedData = consolidatedData || {};
      
      if (consolidatedData.rankings) {
        // Encontrar o ranking específico deste concurso
        for (const [rankingId, ranking] of Object.entries(consolidatedData.rankings)) {
          const rankingConcursoId = (ranking as any).concurso_id;
          
          // ✅ SEGURANÇA: Log sanitizado da comparação (sem dados completos)
          if (rankingsForConcurso.length === 0) {
            devLog.debug('🔍 [RANKING_SERVICE] Comparando concurso_id', {
              match: rankingConcursoId === concursoId,
              rankingType: typeof ranking,
              rankingIsObject: typeof ranking === 'object',
              hasUserData: !!(ranking as any).user_data
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
        devLog.debug('⚠️ [RANKING_SERVICE] consolidatedData não tem rankings', {
          consolidatedDataType: typeof consolidatedData,
          consolidatedDataKeyCount: Object.keys(consolidatedData).length,
          consolidatedDataIsArray: Array.isArray(consolidatedData)
        });
      }
    }

    devLog.debug('✅ [RANKING_SERVICE] Rankings encontrados para o concurso', {
      total: rankingsForConcurso.length
    });

    // ✅ CORREÇÃO CRÍTICA: Buscar dados do concurso para verificar exam_type
    const { data: concursoData, error: concursoError } = await supabase
      .from('concursos')
      .select('exam_type')
      .eq('id', concursoId)
      .maybeSingle();

    if (concursoError) {
      devLog.warn('⚠️ [RANKING_SERVICE] Erro ao buscar exam_type do concurso, usando padrão', sanitizeForLog(concursoError));
    }

    const examType = concursoData?.exam_type || 'Múltipla Escolha';

    // ✅ CORREÇÃO CRÍTICA: Função para verificar se ranking está abaixo do mínimo
    const isBelowMinimum = (rankingData: any): boolean => {
      const userData = rankingData?.user_data || rankingData || {};
      const score = userData?.score || rankingData?.score || 0;
      
      // Verificação de mínimos por disciplina/bloco
      const hasDisciplineMinimums = (userData?.belowDisciplineMinimums || userData?.below_discipline_minimums || []).length > 0;
      const hasBlockMinimums = (userData?.belowBlockMinimums || userData?.below_block_minimums || []).length > 0;
      
      // Para provas "Certo ou Errado" ou "Alternativas", eliminar se nota <= 0
      const isCertoErradoEliminated = examType === 'Certo ou Errado' && score <= 0;
      const isAlternativasEliminated = examType === 'Alternativas' && score <= 0;
      
      return !!(userData?.belowMinimum || userData?.below_minimum) || 
             hasDisciplineMinimums || 
             hasBlockMinimums || 
             isCertoErradoEliminated || 
             isAlternativasEliminated;
    };

    // ✅ CORREÇÃO CRÍTICA: Separar classificados de eliminados ANTES de ordenar
    const classifiedRankings: typeof rankingsForConcurso = [];
    const eliminatedRankings: typeof rankingsForConcurso = [];

    rankingsForConcurso.forEach((item) => {
      if (isBelowMinimum(item.rankingData)) {
        eliminatedRankings.push(item);
      } else {
        classifiedRankings.push(item);
      }
    });

    devLog.debug('✅ [RANKING_SERVICE] Rankings separados', {
      classified: classifiedRankings.length,
      eliminated: eliminatedRankings.length
    });

    // Ordenar classificados por score (descendente)
    classifiedRankings.sort((a, b) => {
      const scoreA = (a.rankingData as any).user_data?.score || 0;
      const scoreB = (b.rankingData as any).user_data?.score || 0;
      return scoreB - scoreA;
    });

    // Ordenar eliminados por score (descendente) - apenas para manter ordem consistente
    eliminatedRankings.sort((a, b) => {
      const scoreA = (a.rankingData as any).user_data?.score || 0;
      const scoreB = (b.rankingData as any).user_data?.score || 0;
      return scoreB - scoreA;
    });

    // ✅ CORREÇÃO: Combinar classificados primeiro, depois eliminados
    const sortedRankingsForConcurso = [...classifiedRankings, ...eliminatedRankings];

    // Buscar perfis de usuários separadamente (RPC não retorna perfis)
    const userIds = [...new Set(sortedRankingsForConcurso.map((item: any) => item.user_id))];
    
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
    const paginatedData = sortedRankingsForConcurso.map((item: any) => {
      const userProfile = profileMap.get(item.user_id) || { name: 'Usuário', avatar_url: null };
      return {
        user_id: item.user_id,
        rankingId: item.rankingId,
        rankingData: item.rankingData,
        users_profiles: userProfile
      };
    });

    // ✅ CORREÇÃO CRÍTICA: Calcular posições considerando empates APENAS para classificados
    // Separar índices de classificados e eliminados
    const classifiedIndices: number[] = [];
    const eliminatedIndices: number[] = [];

    paginatedData.forEach((item: any, index: number) => {
      if (isBelowMinimum(item.rankingData)) {
        eliminatedIndices.push(index);
      } else {
        classifiedIndices.push(index);
      }
    });

    // Agrupar classificados por score para identificar empates
    const scoreGroups: { score: number; indices: number[] }[] = [];
    let currentScore: number | null = null;
    let currentGroup: number[] = [];

    classifiedIndices.forEach((index) => {
      const item = paginatedData[index];
      const rankingData = item.rankingData || item;
      const userData = rankingData?.user_data || rankingData || {};
      const score = userData?.score || rankingData?.score || 0;

      if (currentScore === null || score !== currentScore) {
        // Novo grupo de score
        if (currentGroup.length > 0) {
          scoreGroups.push({ score: currentScore!, indices: currentGroup });
        }
        currentScore = score;
        currentGroup = [index];
      } else {
        // Mesmo score, adicionar ao grupo atual
        currentGroup.push(index);
      }
    });

    // Adicionar último grupo
    if (currentGroup.length > 0 && currentScore !== null) {
      scoreGroups.push({ score: currentScore, indices: currentGroup });
    }

    // ✅ CORREÇÃO CRÍTICA: Calcular posições considerando empates APENAS para classificados
    let positionCounter = offset + 1;
    const positionMap = new Map<number, number>();

    scoreGroups.forEach((group) => {
      // Todos os índices neste grupo recebem a mesma posição
      const position = positionCounter;
      group.indices.forEach((index) => {
        positionMap.set(index, position);
      });
      // Próxima posição será positionCounter + quantidade de pessoas neste grupo
      positionCounter += group.indices.length;
    });

    // Eliminados não recebem posição (ou recebem 0)
    eliminatedIndices.forEach((index) => {
      positionMap.set(index, 0);
    });

    // Mapear resultados para o formato esperado
    const rankings: Ranking[] = paginatedData.map((item: any, index: number) => {
      // RPC retorna dados já formatados, mas precisamos extrair user_data
      // item.rankingData já é o objeto ranking de consolidated_data->rankings->[rankingId]
      const rankingData = item.rankingData || item;
      
      // ✅ DEBUG DETALHADO: Verificar estrutura completa
      if (index === 0) {
        devLog.debug('🔍 [RANKING_SERVICE] rankingData structure (primeiro item - sanitizado)', {
          itemKeyCount: Object.keys(item).length,
          rankingDataKeyCount: Object.keys(rankingData || {}).length,
          hasUserData: !!rankingData?.user_data,
          rankingDataType: typeof rankingData,
          rankingDataIsArray: Array.isArray(rankingData)
        });
      }
      
      // rankingData.user_data contém todos os dados do usuário
      const userData = rankingData?.user_data || rankingData || {};
      
      // ✅ DEBUG: Verificar se userData está vazio ou tem dados
      if (index === 0) {
        // ✅ SEGURANÇA: Log sanitizado da estrutura userData (sem dados completos)
        const allUserDataKeys = Object.keys(userData);
        devLog.debug('🔍 [RANKING_SERVICE] Estrutura userData (primeiro item):', {
          totalKeys: allUserDataKeys.length,
          keySample: allUserDataKeys.slice(0, 10), // Apenas amostra de chaves
          hasWeightedCustomDisciplineScores: !!userData?.weightedCustomDisciplineScores,
          hasWeightedCustomDisciplineScoresSnake: !!userData?.weighted_custom_discipline_scores,
          hasWeightedObjectScores: !!userData?.weighted_object_scores,
          hasWeightedObjectScoresCamel: !!userData?.weightedObjectScores,
          hasObjectScores: !!userData?.object_scores,
          objectScoresType: typeof userData?.object_scores,
          weightedCustomDisciplineScoresType: typeof userData?.weightedCustomDisciplineScores,
          // Apenas contagens e chaves, não valores completos
          objectScoresKeyCount: userData?.object_scores ? Object.keys(userData.object_scores).length : 0,
          weightedCustomDisciplineScoresKeyCount: userData?.weightedCustomDisciplineScores ? Object.keys(userData.weightedCustomDisciplineScores).length : 0,
          sampleObjectScoresKeys: userData?.object_scores ? Object.keys(userData.object_scores).slice(0, 5) : null,
          sampleWeightedCustomKeys: userData?.weightedCustomDisciplineScores ? Object.keys(userData.weightedCustomDisciplineScores).slice(0, 5) : null
        });
        
        // Verificar se há alguma chave que contenha "weighted" ou "custom" ou "discipline"
        const keysWithWeighted = allUserDataKeys.filter(k => k.toLowerCase().includes('weighted'));
        const keysWithCustom = allUserDataKeys.filter(k => k.toLowerCase().includes('custom'));
        const keysWithDiscipline = allUserDataKeys.filter(k => k.toLowerCase().includes('discipline'));
        devLog.debug('🔍 [RANKING_SERVICE] Chaves relacionadas (contagens):', {
          weightedCount: keysWithWeighted.length,
          customCount: keysWithCustom.length,
          disciplineCount: keysWithDiscipline.length,
          weightedSample: keysWithWeighted.slice(0, 5),
          customSample: keysWithCustom.slice(0, 5)
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
      
      // ✅ SEGURANÇA: Log sanitizado dos dados extraídos (sem valores completos)
      if (index === 0) {
        devLog.debug('🔍 [RANKING_SERVICE] Dados extraídos (primeiro item - sanitizado):', {
          weightedObjectScoresKeyCount: Object.keys(weightedObjectScores).length,
          objectScoresKeyCount: Object.keys(objectScores).length,
          weightedObjectScoresKeys: Object.keys(weightedObjectScores).slice(0, 5), // Apenas chaves, não valores
          objectScoresKeys: Object.keys(objectScores).slice(0, 5),
          hasWeightedSubjectives: Object.keys(weightedSubjectives).length > 0,
          weightedSubjectivesKeyCount: Object.keys(weightedSubjectives).length,
          weightedSubjectivesKeys: Object.keys(weightedSubjectives).slice(0, 5)
        });
      }

      const isEliminated = isBelowMinimum(rankingData);
      
      return {
        id: item.rankingId || rankingData?.id || `ranking-${item.user_id}-${index}`, // Usar o rankingId específico
        position: isEliminated ? 0 : (positionMap.get(index) || 0), // ✅ CORREÇÃO CRÍTICA: Eliminados recebem posição 0, classificados recebem posição considerando empates
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
          // ✅ SEGURANÇA: Log sanitizado da criação de weightedCustomDisciplineScores (sem dados completos)
          if (index === 0) {
            devLog.debug('🔍 [RANKING_SERVICE] Criando weightedCustomDisciplineScores (sanitizado):', {
              weightedObjectScoresKeyCount: Object.keys(weightedObjectScores).length,
              objectScoresKeyCount: Object.keys(objectScores).length,
              weightedObjectScoresKeys: Object.keys(weightedObjectScores).slice(0, 10), // Apenas chaves
              objectScoresKeys: Object.keys(objectScores).slice(0, 10),
              objectScoresCustomKeys: Object.keys(objectScores).filter(k => k.startsWith('custom_')).slice(0, 10),
              weightedObjectScoresCustomKeys: Object.keys(weightedObjectScores).filter(k => k.startsWith('custom_')).slice(0, 10)
            });
          }
          
          if (Object.keys(weightedObjectScores).length > 0) {
            // ✅ CORREÇÃO: Usar TODOS os dados diretamente, sem filtro
            // O backend já salva apenas as disciplinas customizadas em weightedCustomDisciplineScores
            if (index === 0) {
              devLog.debug('✅ [RANKING_SERVICE] Usando weightedObjectScores completo (sanitizado):', {
                keyCount: Object.keys(weightedObjectScores).length,
                keys: Object.keys(weightedObjectScores).slice(0, 10) // Apenas chaves, não valores
              });
            }
            return weightedObjectScores; // ✅ Retornar TODOS os dados, sem filtro
          }
          // Fallback: se não houver weighted scores, usar object_scores (sem peso)
          const fallback = Object.fromEntries(
            Object.entries(objectScores).filter(([k]) => k.startsWith('custom_'))
          );
          if (index === 0) {
            devLog.debug('⚠️ [RANKING_SERVICE] Usando fallback (object_scores filtrado)', {
              fallbackKeyCount: Object.keys(fallback).length,
              fallbackKeys: Object.keys(fallback).slice(0, 5) // Apenas chaves, não valores
            });
          }
          // ✅ CORREÇÃO: Se o fallback resultou em vazio mas há objectScores, usar TODOS
          if (Object.keys(fallback).length === 0 && Object.keys(objectScores).length > 0) {
            if (index === 0) {
              devLog.debug('⚠️ [RANKING_SERVICE] Fallback resultou vazio, usando todos os objectScores');
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

    // ✅ SEGURANÇA: Log sanitizado dos dados finais (sem valores completos)
    if (rankings.length > 0) {
      devLog.debug('✅ [RANKING_SERVICE] Rankings mapeados (primeiro item - sanitizado):', {
        totalRankings: rankings.length,
        firstRanking: {
          id: rankings[0].id,
          name: '[REDACTED]', // Não expor nome completo
          score: rankings[0].score,
          hasWeightedCustomDisciplineScores: !!rankings[0].weightedCustomDisciplineScores,
          weightedCustomDisciplineScoresKeyCount: rankings[0].weightedCustomDisciplineScores ? Object.keys(rankings[0].weightedCustomDisciplineScores).length : 0,
          weightedCustomDisciplineScoresKeys: rankings[0].weightedCustomDisciplineScores ? Object.keys(rankings[0].weightedCustomDisciplineScores).slice(0, 5) : [], // Apenas chaves
          hasCustomDisciplineScores: !!rankings[0].customDisciplineScores,
          customDisciplineScoresKeyCount: rankings[0].customDisciplineScores ? Object.keys(rankings[0].customDisciplineScores).length : 0,
          customDisciplineScoresKeys: rankings[0].customDisciplineScores ? Object.keys(rankings[0].customDisciplineScores).slice(0, 5) : []
        }
      });
    }
    
    // ✅ CORREÇÃO: Verificar se os rankings têm os campos necessários antes de salvar no cache
    // Garantir que pelo menos alguns rankings tenham weightedCustomDisciplineScores
    const rankingsWithScores = rankings.filter(r => 
      r.weightedCustomDisciplineScores && Object.keys(r.weightedCustomDisciplineScores).length > 0
    );
    
    if (rankings.length > 0 && rankingsWithScores.length === 0) {
      devLog.warn('⚠️ [RANKING_SERVICE] Nenhum ranking tem weightedCustomDisciplineScores válido');
      devLog.debug('⚠️ [RANKING_SERVICE] Estrutura dos dados (sanitizado):', {
        sampleRanking: rankings[0] ? {
          keyCount: Object.keys(rankings[0]).length,
          allKeys: Object.keys(rankings[0]).slice(0, 10), // Apenas amostra de chaves
          hasCustomDisciplineScores: !!rankings[0].customDisciplineScores,
          customDisciplineScoresKeyCount: rankings[0].customDisciplineScores ? Object.keys(rankings[0].customDisciplineScores).length : 0,
          customDisciplineScoresKeys: rankings[0].customDisciplineScores ? Object.keys(rankings[0].customDisciplineScores).slice(0, 5) : []
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
    devLog.error('❌ [RANKING_SERVICE] Erro geral', sanitizeForLog({
      message: error?.message,
      name: error?.name
    }));
    logger.error('Error in fetchUserRankings', 'RANKING_SERVICE', error);
    throw error;
  } finally {
    const endTime = performance.now();
    devLog.debug('🏁 [RANKING_SERVICE] Fim fetchUserRankings', {
      duration: `${(endTime - startTime).toFixed(2)}ms`
    });
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
