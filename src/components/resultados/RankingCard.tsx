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
  return <Card className="my-[30px] overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 border-b">
        <CardTitle className="text-xl flex items-center">
          <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
          Ranking
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-3">
          <div className="flex items-center bg-muted p-2 rounded-md">
            <Users className="mr-2 h-5 w-5 text-primary" />
            <div className="font-medium flex items-center">
              Participantes: <Badge className="ml-2 bg-primary/10 text-primary border-primary/20">{participantCount}</Badge>
            </div>
          </div>
          
          <div className="flex items-center bg-muted p-2 rounded-md">
            <Users className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="font-medium flex items-center">
              Inscritos: <Badge className="ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700" variant="outline">{inscritos}</Badge>
            </div>
          </div>
          
          {userRanking && <div className="mt-4 text-sm p-3 rounded-lg border bg-primary/5 border-primary/20">
              <div className="font-medium flex flex-wrap gap-2 items-center">
                Sua posição: 
                <Badge className="bg-yellow-500 dark:bg-yellow-600">{userRanking.position}º</Badge> com{' '}
                <Badge variant="secondary">{userRanking.score} pontos</Badge>
              </div>
            </div>}
        </div>
      </CardContent>
    </Card>;
};