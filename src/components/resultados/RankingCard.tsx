
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface RankingCardProps {
  participantCount?: number;
  userRanking?: {
    position: number;
    score: number;
  } | null;
}

export const RankingCard: React.FC<RankingCardProps> = ({
  participantCount,
  userRanking,
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center">
          <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
          Ranking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg">
          Total de participantes: <Badge variant="outline">{participantCount || 0}</Badge>
        </p>
        {userRanking && (
          <p className="mt-2 text-lg">
            Sua posição: <Badge>{userRanking.position}º</Badge> com{' '}
            <Badge variant="secondary">{userRanking.score} pontos</Badge>
          </p>
        )}
      </CardContent>
    </Card>
  );
};
