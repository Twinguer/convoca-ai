
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface StatisticsCardProps {
  participantCount: number;
  inscritos: number;
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({ 
  participantCount, 
  inscritos 
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center">
          <Users className="mr-2 h-5 w-5 text-blue-500" />
          Estatísticas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm">
            Participantes: <span className="font-bold">{participantCount}</span>
          </p>
          <p className="text-sm">
            Inscritos: <span className="font-bold">{inscritos}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatisticsCard;
