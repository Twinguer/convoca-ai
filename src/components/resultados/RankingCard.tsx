
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface RankingCardProps {
  userRanking?: {
    position: number;
    score: number;
  } | null;
}

export const RankingCard: React.FC<RankingCardProps> = ({
  userRanking
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
        <div className="space-y-1">
          {userRanking && (
            <div className="space-y-2">
              <p className="text-lg">
                Posição: <Badge>{userRanking.position}º</Badge>
              </p>
              <p className="text-lg">
                Pontos: <Badge variant="secondary">{userRanking.score}</Badge>
              </p>
            </div>
          )}
          {!userRanking && (
            <p className="text-gray-500 text-sm">
              Participe do ranking para ver sua posição e pontuação
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
