import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Calendar } from 'lucide-react';
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
  return <Link to={`/concurso/${id}/resultados`}>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-lg font-bold mx-0 px-0 my-0 py-0 text-gray-500">{banca}: {concursoTitle}</p>
              <div className="flex flex-col gap-1 items-end">
                <Badge variant="outline" className={`text-xs w-fit ${getStatusColor(status)}`}>
                  {status || 'Em andamento'}
                </Badge>
                {examDate && <div className="flex items-center text-xs text-gray-500 mx-[5px]">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(examDate)}
                  </div>}
              </div>
            </div>
            
            <div className="mb-2">
              
              <h3 className="text-lg font-bold">{cargoTitle}</h3>
            </div>

            <div className="flex items-center justify-between mt-2">
              <p className="text-sm">
                
                {participantCount.toLocaleString()} participantes
              </p>
              
              {(creatorName || isAdminCreated) && <div className="flex items-center text-xs text-gray-500">
                  
                  <span className="text-right mx-0 text-xs">Criado por: {isAdminCreated ? 'Admin' : creatorName}</span>
                  {!isAdminCreated}
                </div>}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>;
};
export const RankingList: React.FC<RankingListProps> = ({
  rankings,
  isLoading
}) => {
  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px]">
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
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px]">
      {rankings.map(ranking => <RankingItem key={ranking.id} {...ranking} />)}
    </div>;
};