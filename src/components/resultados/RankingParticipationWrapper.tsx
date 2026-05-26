import React from 'react';
import { useParams } from 'react-router-dom';
import { useResultadosData } from '@/hooks/useResultadosData';
import { ParticipationForm } from '@/modules/rankings/components/participation/ParticipationForm';
import { LoadingState } from '@/modules/rankings/components/classification/LoadingState';
import { logger } from '@/utils/logger';

interface RankingParticipationWrapperProps {
  rankingId?: string;
}

const RankingParticipationWrapper: React.FC<RankingParticipationWrapperProps> = ({ rankingId }) => {
  const { id } = useParams<{ id: string }>();
  const finalRankingId = rankingId || id;
  // Usar dados de concurso específico
  const { concurso, userRanking, isParticipating, isLoading, userRankingId } = useResultadosData(finalRankingId);
  
  // Log para debugging
  React.useEffect(() => {
    logger.info('RankingParticipationWrapper loaded', 'RANKING_PARTICIPATION', {
      rankingId: finalRankingId,
      concursoId: concurso?.id,
      isParticipating,
      isLoading,
      hasError: false
    });
  }, [finalRankingId, concurso?.id, isParticipating, isLoading]);

  if (isLoading) {
    return <LoadingState />;
  }

  // Removido tratamento de erro pois não está disponível no hook

  if (!concurso) {
    logger.warn('Ranking not found for participation', 'RANKING_PARTICIPATION', { rankingId: finalRankingId });
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Ranking não encontrado</h2>
          <p>O ranking solicitado não foi encontrado ou não está mais disponível.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <ParticipationForm
        concurso={concurso}
        isAlreadyParticipating={isParticipating}
        userRankingId={userRankingId}
        showAnswerSheet={true}
      />
    </div>
  );
};

export default RankingParticipationWrapper;
