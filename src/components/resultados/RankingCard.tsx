
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RankingCardProps {
  title?: string;
  orgao?: string;
  banca?: string;
  data?: string;
  status?: string;
  participantCount?: number; // Changed from participantsCount to participantCount
  userRanking?: any; // Added userRanking prop
  inscritos?: number; // Added inscritos prop
  createdByUserId?: string;
  isAdminCreated?: boolean;
}

export const RankingCard: React.FC<RankingCardProps> = ({
  title,
  orgao,
  banca,
  data,
  status,
  participantCount, // Updated prop name
  createdByUserId,
  isAdminCreated,
  userRanking,
  inscritos
}) => {
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
        {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
        {(orgao || banca || data) && (
          <div className="text-sm text-gray-500 space-y-1">
            {orgao && <div>Órgão: {orgao}</div>}
            {banca && <div>Banca: {banca}</div>}
            {data && <div>Data: {data}</div>}
            {createdByUserId && (
              <div>
                {isLoadingCreator ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>
                    Criador: {isAdminCreated ? 'Admin' : creatorData?.name || 'Usuário'}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          {status && (
            <Badge variant={status === 'Em andamento' ? 'default' : 'secondary'}>
              {status}
            </Badge>
          )}
          {participantCount !== undefined && (
            <span className="text-sm text-gray-500">
              {participantCount} {participantCount === 1 ? 'participante' : 'participantes'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
