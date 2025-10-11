import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRankingsLegacyData } from '@/hooks/useRankingsLegacyData';
import { useRankingsV2Data } from '@/hooks/useRankingsV2Data';
import { shouldUseLegacyStructure } from '@/config/rankingStructure';

interface RankingParticipationDebugProps {
  rankingId: string;
}

export const RankingParticipationDebug: React.FC<RankingParticipationDebugProps> = ({ rankingId }) => {
  const { user } = useAuth();
  const useLegacy = shouldUseLegacyStructure('rankingOperations');
  
  const legacyData = useRankingsLegacyData(rankingId);
  const v2Data = useRankingsV2Data(rankingId);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Debug - Participação em Ranking</span>
          <Badge variant={useLegacy ? "default" : "secondary"}>
            {useLegacy ? "Estrutura Antiga" : "Estrutura Nova"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Informações do Usuário */}
          <div>
            <h3 className="font-semibold mb-2">Usuário</h3>
            <div className="space-y-1 text-sm">
              <div>ID: {user?.id || 'Não logado'}</div>
              <div>Email: {user?.email || 'N/A'}</div>
              <div>Autenticado: {user ? 'Sim' : 'Não'}</div>
            </div>
          </div>

          {/* Configuração */}
          <div>
            <h3 className="font-semibold mb-2">Configuração</h3>
            <div className="space-y-1 text-sm">
              <div>Ranking ID: {rankingId}</div>
              <div>Usar Estrutura Antiga: {useLegacy ? 'Sim' : 'Não'}</div>
              <div>Estrutura Ativa: {useLegacy ? 'Legacy' : 'V2'}</div>
            </div>
          </div>
        </div>

        {/* Dados Legacy */}
        <div>
          <h3 className="font-semibold mb-2">Dados Legacy (concursos/user_rankings)</h3>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <div>Concurso: {legacyData.concurso ? 'Encontrado' : 'Não encontrado'}</div>
            <div>Participando: {legacyData.isParticipating ? 'Sim' : 'Não'}</div>
            <div>User Ranking ID: {legacyData.userRanking?.id || 'N/A'}</div>
            <div>Participantes: {legacyData.participantCount}</div>
            <div>Carregando: {legacyData.isLoading ? 'Sim' : 'Não'}</div>
            <div>Erro: {legacyData.error || 'Nenhum'}</div>
            {legacyData.concurso && (
              <div className="mt-2">
                <div>Título: {legacyData.concurso.titulo}</div>
                <div>Órgão: {legacyData.concurso.orgao}</div>
                <div>Status: {legacyData.concurso.status}</div>
              </div>
            )}
          </div>
        </div>

        {/* Dados V2 */}
        <div>
          <h3 className="font-semibold mb-2">Dados V2 (create_ranking_new/user_ranking_new)</h3>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <div>Ranking: {v2Data.ranking ? 'Encontrado' : 'Não encontrado'}</div>
            <div>Participando: {v2Data.isParticipating ? 'Sim' : 'Não'}</div>
            <div>User Ranking ID: {v2Data.userRanking?.id || 'N/A'}</div>
            <div>Participantes: {v2Data.participantCount}</div>
            <div>Carregando: {v2Data.isLoading ? 'Sim' : 'Não'}</div>
            <div>Erro: {v2Data.error || 'Nenhum'}</div>
            {v2Data.ranking && (
              <div className="mt-2">
                <div>Título: {v2Data.ranking.titulo}</div>
                <div>Órgão: {v2Data.ranking.orgao}</div>
                <div>Status: {v2Data.ranking.status}</div>
              </div>
            )}
          </div>
        </div>

        {/* Diagnóstico */}
        <div>
          <h3 className="font-semibold mb-2">Diagnóstico</h3>
          <div className="space-y-1 text-sm">
            {!user && (
              <div className="text-red-600">❌ Usuário não está logado</div>
            )}
            {!rankingId && (
              <div className="text-red-600">❌ Ranking ID não fornecido</div>
            )}
            {useLegacy && !legacyData.concurso && !legacyData.isLoading && (
              <div className="text-red-600">❌ Concurso não encontrado na estrutura antiga</div>
            )}
            {!useLegacy && !v2Data.ranking && !v2Data.isLoading && (
              <div className="text-red-600">❌ Ranking não encontrado na estrutura nova</div>
            )}
            {legacyData.error && (
              <div className="text-red-600">❌ Erro na estrutura antiga: {legacyData.error}</div>
            )}
            {v2Data.error && (
              <div className="text-red-600">❌ Erro na estrutura nova: {v2Data.error}</div>
            )}
            {user && rankingId && ((useLegacy && legacyData.concurso) || (!useLegacy && v2Data.ranking)) && (
              <div className="text-green-600">✅ Configuração correta para participação</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


