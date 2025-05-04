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
  return <Card className="my-[30px] bg-white border-slate-200 overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-emerald-50 to-emerald-100 border-b">
        <CardTitle className="text-xl flex items-center text-slate-800">
          <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
          Ranking
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-3">
          <div className="flex items-center bg-slate-50 p-2 rounded-md">
            <Users className="mr-2 h-5 w-5 text-emerald-600" />
            <p className="font-medium text-slate-700">
              Participantes: <Badge className="ml-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">{participantCount}</Badge>
            </p>
          </div>
          
          <div className="flex items-center bg-slate-50 p-2 rounded-md">
            <Users className="mr-2 h-5 w-5 text-blue-600" />
            <p className="font-medium text-slate-700">
              Inscritos: <Badge className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200" variant="outline">{inscritos}</Badge>
            </p>
          </div>
          
          {userRanking && <div className="mt-4 text-sm p-3 rounded-lg border border-yellow-100 bg-emerald-50">
              <p className="font-medium text-slate-700 flex flex-wrap gap-2 items-center">
                Sua posição: 
                <Badge className="bg-yellow-500">{userRanking.position}º</Badge> com{' '}
                <Badge variant="secondary" className="bg-slate-100 text-slate-700">{userRanking.score} pontos</Badge>
              </p>
            </div>}
        </div>
      </CardContent>
    </Card>;
};