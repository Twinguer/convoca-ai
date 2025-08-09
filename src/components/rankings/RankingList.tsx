
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Calendar, Trophy, Users, MapPin } from 'lucide-react';

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
  localidade?: string;
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
  status,
  localidade
}) => {
  const getStatusColor = (status?: string) => {
    if (!status || status === 'Em andamento') {
      return 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-200';
    }
    return '';
  };
  
  return (
    <Link to={`/concurso/${id}/resultados`}>
      <Card className="hover:shadow-lg transition-all duration-300 bg-card hover:translate-y-[-4px]">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 font-medium text-xs px-2 py-0.5">
                  {banca}
                </Badge>
              </div>
              
              <div className="flex flex-col gap-1 items-end">
                <Badge variant="outline" className={`text-xs font-medium ${getStatusColor(status)}`}>
                  {status || 'Em andamento'}
                </Badge>
                {examDate && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(examDate)}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-base font-bold leading-tight text-foreground mb-1">
                {concursoTitle}
              </h3>
              <p className="text-sm text-emerald-700 font-semibold mb-2 break-words">
                {cargoTitle}
              </p>
              
              {localidade && (
                <div className="flex items-center text-xs text-muted-foreground mb-2">
                  <MapPin className="h-3 w-3 mr-1" />
                  {localidade}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-700">
                  {(participantCount || 0).toLocaleString()} participantes
                </p>
              </div>
              
              {(creatorName || isAdminCreated) && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="text-right text-xs">
                    Criado por: {isAdminCreated ? 'Admin' : creatorName}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export const RankingList: React.FC<RankingListProps> = ({
  rankings,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
              <div className="h-5 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/4 mt-3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (rankings.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-8 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground">Nenhum ranking disponível no momento.</p>
          <p className="text-sm text-muted-foreground mt-1">Novos rankings serão adicionados em breve.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {rankings.map(ranking => <RankingItem key={ranking.id} {...ranking} />)}
    </div>
  );
};
