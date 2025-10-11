import React from 'react';
import { useParams } from 'react-router-dom';
import { useResultadosData } from '@/hooks/useResultadosData';
import { ParticipationForm } from './ParticipationForm';
import { LoadingState } from './LoadingState';
import { logger } from '@/utils/logger';

interface RankingParticipationWrapperProps {
  rankingId?: string;
}

const RankingParticipationWrapper: React.FC<RankingParticipationWrapperProps> = ({ rankingId }) => {
  const { id } = useParams<{ id: string }>();
  const finalRankingId = rankingId || id;
  // Usar dados de concurso específico
  const { concurso, userRanking, isParticipating, isLoading, error } = useResultadosData(finalRankingId);
  
  // Log para debugging
  React.useEffect(() => {
    logger.info('RankingParticipationWrapper loaded', 'RANKING_PARTICIPATION', {
      rankingId: finalRankingId,
      concursoId: concurso?.id,
      isParticipating,
      isLoading,
      hasError: !!error
    });
  }, [finalRankingId, concurso?.id, isParticipating, isLoading, error]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    logger.error('Error loading ranking for participation', 'RANKING_PARTICIPATION', { error, rankingId: finalRankingId });
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Erro ao carregar ranking</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

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
        userRankingId={userRanking?.id}
        showAnswerSheet={true}
      />
    </div>
  );
};

export default RankingParticipationWrapper;
