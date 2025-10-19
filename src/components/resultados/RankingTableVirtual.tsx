/**
 * Componente de tabela de ranking otimizado
 * Versão simplificada sem virtual scrolling para compatibilidade
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadMoreButton } from './LoadMoreButton';
import { logger } from '@/utils/logger';
import type { Ranking } from '@/services/rankingService';
import { formatScore } from '@/lib/utils';

interface RankingTableVirtualProps {
  rankings: Ranking[];
  currentUserId?: string | null;
  handleUserClick: (userId: string) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  totalLoaded?: number;
}

const RankingRow: React.FC<{
  ranking: Ranking;
  currentUserId?: string | null;
  handleUserClick: (userId: string) => void;
  isAmpla: boolean;
  displayNames: Record<string, string>;
}> = ({ ranking, currentUserId, handleUserClick, isAmpla, displayNames }) => {
  const isCurrentUser = currentUserId === ranking.userId;
  const isBelowMinimum = ranking.belowMinimum;

  const getScoreColor = (score: number) => {
    if (isBelowMinimum) return 'text-red-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return 'bg-yellow-100 text-yellow-800';
    if (position === 2) return 'bg-gray-100 text-gray-800';
    if (position === 3) return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div 
      className={`flex items-center p-4 border-b hover:bg-gray-50 transition-colors ${
        isCurrentUser ? 'bg-blue-50 border-blue-200' : ''
      }`}
    >
      {/* Posição */}
      <div className="w-16 flex-shrink-0 text-center">
        <Badge 
          variant="secondary" 
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getPositionColor(ranking.position)}`}
        >
          {ranking.position}
        </Badge>
      </div>

      {/* Avatar e Nome */}
      <div className="flex items-center flex-1 min-w-0">
        <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
          <AvatarImage src={ranking.avatarUrl || undefined} />
          <AvatarFallback>
            {ranking.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="min-w-0 flex-1">
          <button
            onClick={() => handleUserClick(ranking.userId)}
            className="text-left hover:text-blue-600 transition-colors"
          >
            <p className="font-medium text-sm truncate">
              {ranking.name}
              {isCurrentUser && (
                <span className="ml-2 text-xs text-blue-600 font-normal">(Você)</span>
              )}
            </p>
          </button>
          
          {!isAmpla && (
            <p className="text-xs text-gray-500 truncate">
              {ranking.displayReservation}
            </p>
          )}
        </div>
      </div>

      {/* Pontuação Principal */}
      <div className="w-24 text-right flex-shrink-0">
        <p className={`text-lg font-bold ${getScoreColor(ranking.score)}`}>
          {formatScore(ranking.score)}
        </p>
        {isBelowMinimum && (
          <p className="text-xs text-red-500">Abaixo do mínimo</p>
        )}
      </div>

      {/* Pontuações Detalhadas (apenas para os primeiros 10) */}
      {ranking.position <= 10 && (
        <div className="hidden lg:flex flex-col text-xs text-gray-600 ml-4 w-32">
          {ranking.discursiveScore > 0 && (
            <div className="flex justify-between">
              <span>Discursiva:</span>
              <span>{formatScore(ranking.discursiveScore)}</span>
            </div>
          )}
          {ranking.caseStudy1Score > 0 && (
            <div className="flex justify-between">
              <span>PE1:</span>
              <span>{formatScore(ranking.caseStudy1Score)}</span>
            </div>
          )}
          {ranking.caseStudy2Score > 0 && (
            <div className="flex justify-between">
              <span>PE2:</span>
              <span>{formatScore(ranking.caseStudy2Score)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const RankingTableVirtual: React.FC<RankingTableVirtualProps> = ({
  rankings,
  currentUserId,
  handleUserClick,
  hasMore,
  onLoadMore,
  isLoadingMore,
  totalLoaded
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});

  // Lazy loading - só renderiza quando visível
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Processar nomes para exibição
  useEffect(() => {
    const names: Record<string, string> = {};
    rankings.forEach(ranking => {
      if (ranking.name && ranking.name !== 'Usuário Anônimo') {
        names[ranking.userId] = ranking.name;
      }
    });
    setDisplayNames(names);
  }, [rankings]);

  const isAmpla = useMemo(() => {
    return rankings.every(ranking => 
      ranking.reservationType === 'Ampla Concorrência' || 
      !ranking.reservationType
    );
  }, [rankings]);

  const handleLoadMore = useCallback(() => {
    if (onLoadMore && !isLoadingMore) {
      logger.ranking('Loading more rankings', `currentCount: ${rankings.length}, totalLoaded: ${totalLoaded || 0}`);
      onLoadMore();
    }
  }, [onLoadMore, isLoadingMore, rankings.length, totalLoaded]);

  if (!isVisible) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {rankings.map((ranking) => (
              <RankingRow
                key={ranking.id}
                ranking={ranking}
                currentUserId={currentUserId}
                handleUserClick={handleUserClick}
                isAmpla={isAmpla}
                displayNames={displayNames}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {hasMore && (
        <LoadMoreButton
          onLoadMore={handleLoadMore}
          isLoading={isLoadingMore || false}
          totalLoaded={totalLoaded || 0}
        />
      )}
    </div>
  );
};