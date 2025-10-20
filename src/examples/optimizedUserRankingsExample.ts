/**
 * EXEMPLO DE USO DA ESTRUTURA JSONB OTIMIZADA
 * 
 * Este arquivo demonstra como usar a nova estrutura JSONB otimizada
 * para user_rankings, mostrando casos de uso comuns e melhores práticas.
 */

import OptimizedUserRankingsService from '@/services/optimizedUserRankingsService';
import { 
  UserRankingData, 
  QuotaType, 
  RankingStatus,
  EditHistory 
} from '@/types/userRankings';

// ============================================================================
// EXEMPLO 1: PARTICIPAÇÃO EM CONCURSO
// ============================================================================

export async function exemploParticipacaoConcurso() {
  const userId = 'user-123';
  const concursoId = 'concurso-456';
  const bookletId = 'booklet-789';
  const reservationType: QuotaType = 'Ampla Concorrência';
  
  try {
    // 1. Verificar se pode participar
    const canParticipate = await OptimizedUserRankingsService.canUserParticipate(userId, concursoId);
    if (!canParticipate.canParticipate) {
      console.log('Não pode participar:', canParticipate.reason);
      return;
    }
    
    // 2. Gerar ID único para o ranking
    const rankingId = OptimizedUserRankingsService.generateRankingId(concursoId, userId);
    
    // 3. Criar dados iniciais do ranking
    const initialRankingData = OptimizedUserRankingsService.createInitialRankingData(
      concursoId,
      bookletId,
      reservationType
    );
    
    // 4. Salvar no banco
    const success = await OptimizedUserRankingsService.upsertUserRanking(
      userId,
      rankingId,
      initialRankingData
    );
    
    if (success) {
      console.log('Participação criada com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao participar do concurso:', error);
  }
}

// ============================================================================
// EXEMPLO 2: ATUALIZAÇÃO DE RESPOSTAS
// ============================================================================

export async function exemploAtualizacaoRespostas() {
  const userId = 'user-123';
  const concursoId = 'concurso-456';
  
  try {
    // 1. Buscar ranking atual
    const currentRanking = await OptimizedUserRankingsService.getUserRankingByConcurso(userId, concursoId);
    if (!currentRanking) {
      console.log('Ranking não encontrado');
      return;
    }
    
    // 2. Atualizar respostas
    const updatedRanking: UserRankingData = {
      ...currentRanking,
      answers: {
        ...currentRanking.answers,
        '1': 'A',
        '2': 'B',
        '3': 'C',
        '4': 'D',
        '5': 'E'
      },
      edit_count: currentRanking.edit_count + 1,
      all_questions_answered: true,
      control_metadata: {
        ...currentRanking.control_metadata,
        last_updated: new Date().toISOString(),
        edit_history: [
          ...currentRanking.control_metadata.edit_history,
          {
            timestamp: new Date().toISOString(),
            type: 'answer_change',
            field: 'answers',
            previous_value: currentRanking.answers,
            new_value: { ...currentRanking.answers, '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' },
            user_ip: '192.168.1.1',
            user_agent: 'Mozilla/5.0...'
          } as EditHistory
        ]
      }
    };
    
    // 3. Salvar atualização
    const success = await OptimizedUserRankingsService.updateUserRanking(
      userId,
      `ranking_${concursoId}_${userId}_1234567890`, // ID do ranking
      updatedRanking
    );
    
    if (success) {
      console.log('Respostas atualizadas com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao atualizar respostas:', error);
  }
}

// ============================================================================
// EXEMPLO 3: CÁLCULO DE PONTUAÇÕES
// ============================================================================

export async function exemploCalculoPontuacoes() {
  const concursoId = 'concurso-456';
  
  try {
    // 1. Buscar todos os rankings do concurso
    const rankings = await OptimizedUserRankingsService.getConcursoRankings(concursoId);
    console.log(`Total de participantes: ${rankings.length}`);
    
    // 2. Calcular posições
    const positions = await OptimizedUserRankingsService.calculateConcursoPositions(concursoId);
    console.log('Posições gerais:', positions.general.slice(0, 5)); // Top 5
    console.log('Posições por cota:', Object.keys(positions.quotas));
    
    // 3. Calcular estatísticas de cota específica
    const quotaStats = await OptimizedUserRankingsService.calculateQuotaStatistics(
      concursoId,
      'Ampla Concorrência'
    );
    
    if (quotaStats) {
      console.log('Estatísticas da cota Ampla Concorrência:', {
        total_participants: quotaStats.total_participants,
        min_score: quotaStats.min_score,
        max_score: quotaStats.max_score
      });
    }
  } catch (error) {
    console.error('Erro ao calcular pontuações:', error);
  }
}

// ============================================================================
// EXEMPLO 4: DASHBOARD DO USUÁRIO
// ============================================================================

export async function exemploDashboardUsuario() {
  const userId = 'user-123';
  
  try {
    // 1. Buscar resumos dos rankings
    const summaries = await OptimizedUserRankingsService.getUserRankingSummaries(userId);
    console.log('Resumos dos rankings:', summaries);
    
    // 2. Calcular estatísticas
    const totalRankings = summaries.length;
    const activeRankings = summaries.filter(s => s.status === 'participando').length;
    const classifiedRankings = summaries.filter(s => s.status === 'classificado').length;
    const averageScore = summaries.length ? 
      summaries.reduce((sum, s) => sum + s.score, 0) / summaries.length : 0;
    
    console.log('Estatísticas do usuário:', {
      totalRankings,
      activeRankings,
      classifiedRankings,
      averageScore: Math.round(averageScore * 100) / 100
    });
    
    // 3. Buscar ranking específico
    if (summaries.length > 0) {
      const firstConcurso = summaries[0];
      const specificRanking = await OptimizedUserRankingsService.getUserRankingByConcurso(
        userId,
        firstConcurso.concurso_id
      );
      
      if (specificRanking) {
        console.log('Detalhes do primeiro ranking:', {
          concurso: firstConcurso.concurso_titulo,
          score: specificRanking.score,
          status: specificRanking.status,
          reservation_type: specificRanking.reservation_type,
          edit_count: specificRanking.edit_count
        });
      }
    }
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
  }
}

// ============================================================================
// EXEMPLO 5: VALIDAÇÃO E INTEGRIDADE
// ============================================================================

export async function exemploValidacaoDados() {
  const userId = 'user-123';
  const concursoId = 'concurso-456';
  
  try {
    // 1. Buscar ranking
    const ranking = await OptimizedUserRankingsService.getUserRankingByConcurso(userId, concursoId);
    if (!ranking) {
      console.log('Ranking não encontrado');
      return;
    }
    
    // 2. Validar dados
    const validation = OptimizedUserRankingsService.validateRankingData(ranking);
    
    if (validation.isValid) {
      console.log('Dados do ranking são válidos');
    } else {
      console.log('Erros encontrados:', validation.errors);
    }
    
    // 3. Verificar se pode participar de outro concurso
    const canParticipate = await OptimizedUserRankingsService.canUserParticipate(
      userId,
      'outro-concurso-789'
    );
    
    console.log('Pode participar de outro concurso:', canParticipate);
  } catch (error) {
    console.error('Erro na validação:', error);
  }
}

// ============================================================================
// EXEMPLO 6: USO COM REACT HOOKS
// ============================================================================

// Este exemplo mostra como usar os hooks React em um componente
export const exemploUsoReactHooks = `
import React from 'react';
import { 
  useConcursoParticipation, 
  useUserRankingsDashboard,
  useConcursoPositions 
} from '@/hooks/useOptimizedUserRankings';

export const ConcursoParticipationComponent = ({ concursoId }: { concursoId: string }) => {
  const {
    userRanking,
    isParticipating,
    canParticipate,
    participate,
    isParticipating: isJoining,
    participationError
  } = useConcursoParticipation(concursoId);
  
  const { rankings, isLoading } = useConcursoPositions(concursoId);
  
  const handleParticipate = () => {
    participate({
      concursoId,
      bookletId: 'booklet-123',
      reservationType: 'Ampla Concorrência'
    });
  };
  
  if (isLoading) return <div>Carregando...</div>;
  
  return (
    <div>
      {isParticipating ? (
        <div>
          <h3>Você está participando!</h3>
          <p>Pontuação: {userRanking?.score}</p>
          <p>Status: {userRanking?.status}</p>
        </div>
      ) : canParticipate ? (
        <button onClick={handleParticipate} disabled={isJoining}>
          {isJoining ? 'Participando...' : 'Participar do Concurso'}
        </button>
      ) : (
        <p>Você não pode participar deste concurso</p>
      )}
      
      {participationError && (
        <p style={{ color: 'red' }}>
          Erro: {participationError.message}
        </p>
      )}
      
      <h4>Classificação Geral:</h4>
      <ol>
        {rankings.general.slice(0, 10).map((ranking, index) => (
          <li key={ranking.user_id}>
            {index + 1}º - {ranking.score} pontos
          </li>
        ))}
      </ol>
    </div>
  );
};

export const UserDashboardComponent = () => {
  const {
    summaries,
    isLoading,
    totalRankings,
    activeRankings,
    averageScore
  } = useUserRankingsDashboard();
  
  if (isLoading) return <div>Carregando dashboard...</div>;
  
  return (
    <div>
      <h2>Meus Rankings</h2>
      <div>
        <p>Total: {totalRankings}</p>
        <p>Ativos: {activeRankings}</p>
        <p>Média: {averageScore.toFixed(2)}</p>
      </div>
      
      <ul>
        {summaries?.map(summary => (
          <li key={summary.ranking_id}>
            <strong>{summary.concurso_titulo}</strong>
            <br />
            Pontuação: {summary.score} | 
            Posição: {summary.position}º | 
            Status: {summary.status}
          </li>
        ))}
      </ul>
    </div>
  );
};
`;

// ============================================================================
// EXEMPLO 7: MIGRAÇÃO DE DADOS EXISTENTES
// ============================================================================

export async function exemploMigracaoDados() {
  console.log(`
  Para migrar dados existentes para a nova estrutura:
  
  1. Execute a migração SQL:
     - supabase/migrations/20250116000011_optimize_user_rankings_jsonb_structure.sql
  
  2. A migração irá:
     - Fazer backup dos dados existentes
     - Converter para nova estrutura
     - Criar índices otimizados
     - Criar funções auxiliares
     - Criar triggers de auditoria
  
  3. Verifique a integridade:
     - Execute queries de validação
     - Compare contagens antes/depois
     - Teste funcionalidades principais
  
  4. Atualize o código:
     - Substitua serviços antigos pelos novos
     - Use os hooks React otimizados
     - Aproveite as novas funcionalidades
  `);
}

// ============================================================================
// EXEMPLO 8: MONITORAMENTO E PERFORMANCE
// ============================================================================

export async function exemploMonitoramento() {
  console.log(`
  Para monitorar performance da nova estrutura:
  
  1. Use as views criadas:
     - v_user_rankings_with_profiles
     - v_concurso_statistics
  
  2. Monitore índices:
     - idx_user_rankings_consolidated_data_gin
     - idx_user_rankings_concurso_id
     - idx_user_rankings_status
     - idx_user_rankings_reservation_type
  
  3. Verifique logs de auditoria:
     - Tabela user_rankings_audit
     - Triggers de auditoria
  
  4. Use EXPLAIN ANALYZE:
     - Para queries complexas
     - Para otimizar consultas
     - Para identificar gargalos
  `);
}











