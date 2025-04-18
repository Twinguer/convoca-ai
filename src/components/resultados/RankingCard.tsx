
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users } from 'lucide-react';

interface RankingCardProps {
  participantCount?: number;
  userRanking?: {
    position: number;
    score: number;
  } | null;
  inscritos?: number;
}

export const RankingCard: React.FC<RankingCardProps> = ({
  participantCount = 0,
  userRanking,
  inscritos = 0
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
        <div className="flex items-center">
          <Users className="mr-2 h-5 w-5 text-gray-600" />
          <p className="text-lg">
            Participantes: <Badge variant="outline">{participantCount}</Badge>
          </p>
        </div>
        
        <div className="flex items-center mt-2">
          <Users className="mr-2 h-5 w-5 text-gray-600" />
          <p className="text-lg">
            Total de Inscritos: <Badge variant="outline">{inscritos}</Badge>
          </p>
        </div>
        
        {userRanking && (
          <p className="mt-4 text-lg">
            Sua posição: <Badge>{userRanking.position}º</Badge> com{' '}
            <Badge variant="secondary">{userRanking.score} pontos</Badge>
          </p>
        )}
      </CardContent>
    </Card>
  );
};
