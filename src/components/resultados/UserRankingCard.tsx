
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, User } from 'lucide-react';

interface UserRankingCardProps {
  userRanking: {
    position: number;
    score: number;
  };
  totalParticipants: number;
}

const UserRankingCard: React.FC<UserRankingCardProps> = ({ userRanking, totalParticipants }) => {
  // Calculate percentile (what percentage of participants you're ahead of)
  const percentile = Math.round((1 - userRanking.position / totalParticipants) * 100);
  
  return (
    <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center">
          <User className="mr-2 h-5 w-5 text-emerald-500" />
          Sua classificação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-md shadow-sm">
            <span className="text-sm text-gray-500">Posição</span>
            <div className="flex items-center">
              <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-2xl font-bold">{userRanking.position}º</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-md shadow-sm">
            <span className="text-sm text-gray-500">Pontuação</span>
            <span className="text-2xl font-bold">{userRanking.score.toFixed(2)}</span>
          </div>
          
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-md shadow-sm">
            <span className="text-sm text-gray-500">Você está à frente de</span>
            <span className="text-2xl font-bold">{percentile}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserRankingCard;
