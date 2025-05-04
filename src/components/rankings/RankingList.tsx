import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Calendar, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
export interface RankingItemProps {
  id: string;
  examDate: string;
  banca: string;
  concursoTitle: string;
  cargoTitle: string;
  participantCount: number;
  createdByUserId?: string;
  creatorName?: string;
  isAdminCreated?: boolean;
  status?: string;
}
export interface RankingListProps {
  rankings: RankingItemProps[];
  isLoading: boolean;
}

// Function to truncate text to a specific length
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};
export const RankingItem: React.FC<RankingItemProps> = ({
  id,
  examDate,
  banca,
  concursoTitle,
  cargoTitle,
  participantCount,
  creatorName,
  isAdminCreated,
  status
}) => {
  const getStatusColor = (status?: string) => {
    if (!status || status === 'Em andamento') {
      return 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-200';
    }
    return '';
  };

  // Buscar o número de participantes se não foi fornecido
  const {
    data: fetchedParticipantCount
  } = useQuery({
    queryKey: ['participant-count', id],
    queryFn: async () => {
      if (participantCount > 0) return participantCount;
      const {
        count,
        error
      } = await supabase.from('user_rankings').select('*', {
        count: 'exact',
        head: true
      }).eq('ranking_id', id);
      if (error) {
        console.error('Error fetching participant count:', error);
        return 0;
      }
      return count || 0;
    },
    enabled: id !== undefined
  });
  const truncatedBanca = truncateText(banca, 30);
  const truncatedConcursoTitle = truncateText(concursoTitle, 30);
  const truncatedCargoTitle = truncateText(cargoTitle, 100);
  const currentParticipantCount = fetchedParticipantCount || participantCount || 0;
  return <Link to={`/concurso/${id}/resultados`}>
      
    </Link>;
};
export const RankingList: React.FC<RankingListProps> = ({
  rankings,
  isLoading
}) => {
  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mt-2"></div>
            </CardContent>
          </Card>)}
      </div>;
  }
  if (rankings.length === 0) {
    return <Card>
        <CardContent className="p-6 text-center">
          <p className="text-lg">Nenhum ranking disponível no momento.</p>
        </CardContent>
      </Card>;
  }
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {rankings.map(ranking => <RankingItem key={ranking.id} {...ranking} />)}
    </div>;
};