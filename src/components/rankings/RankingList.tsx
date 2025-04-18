import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Trophy, User, Star } from 'lucide-react';
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
}
export const RankingItem: React.FC<RankingItemProps> = ({
  id,
  examDate,
  banca,
  concursoTitle,
  cargoTitle,
  participantCount,
  creatorName,
  isAdminCreated
}) => {
  return <Link to={`/concurso/${id}/resultados`}>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div>
            
            <div className="flex items-center mb-2">
              <p className="text-sm font-medium text-gray-600">{banca} • {concursoTitle}</p>
            </div>
            <h3 className="text-lg font-bold">{cargoTitle}</h3>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm">
                <Trophy className="inline-block mr-1 h-4 w-4 text-yellow-500" />
                {participantCount.toLocaleString()} participantes
              </p>
              
              {(creatorName || isAdminCreated) && <div className="flex items-center text-xs text-gray-500">
                  <User className="h-3 w-3 mr-1" />
                  <span>Criado por: {isAdminCreated ? 'Admin' : creatorName}</span>
                  {!isAdminCreated && <Star className="h-3 w-3 ml-1 text-yellow-400" />}
                </div>}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>;
};
interface RankingListProps {
  rankings: RankingItemProps[];
  isLoading: boolean;
}
export const RankingList: React.FC<RankingListProps> = ({
  rankings,
  isLoading
}) => {
  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => <Card key={i} className="animate-pulse">
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
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {rankings.map(ranking => <RankingItem key={ranking.id} {...ranking} />)}
    </div>;
};