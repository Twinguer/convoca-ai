
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRankingPosition } from '@/hooks/useRankingPosition';
import { useRankingScore } from '@/hooks/useRankingScore';

interface RankingCardProps {
  title?: string;
  orgao?: string;
  banca?: string;
  data?: string;
  status?: string;
  participantCount?: number;
  userRanking?: {
    id: string;
    position: number;
    score: number;
  };
  inscritos?: number;
  createdByUserId?: string;
  isAdminCreated?: boolean;
}

export const RankingCard: React.FC<RankingCardProps> = ({
  title,
  participantCount,
  createdByUserId,
  isAdminCreated,
  userRanking,
  inscritos
}) => {
  const position = userRanking ? useRankingPosition(userRanking.id) : null;
  const score = userRanking ? useRankingScore(userRanking.id) : null;
  
  const { data: creatorData, isLoading: isLoadingCreator } = useQuery({
    queryKey: ['creator', createdByUserId],
    queryFn: async () => {
      if (isAdminCreated || !createdByUserId) return null;
      
      const { data, error } = await supabase
        .from('users_profiles')
        .select('name')
        .eq('id', createdByUserId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!createdByUserId && !isAdminCreated
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <span>Ranking</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              <span>{participantCount || 0} participante(s)</span>
            </div>
            
            {inscritos !== undefined && (
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4" />
                <span>{inscritos} inscrito(s)</span>
              </div>
            )}
          </div>

          {userRanking && (
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
              <h4 className="text-sm font-medium text-emerald-800 mb-2">Seu desempenho</h4>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Posição:</span>
                <span className="font-medium">{position}º</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-600">Pontuação:</span>
                <span className="font-medium">{score?.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
