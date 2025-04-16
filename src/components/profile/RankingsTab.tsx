
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { UserRankingDisplay } from '@/types/concursos';
import { useAuth } from '@/hooks/useAuth';

interface RankingsTabProps {
  userId: string;
  userRankings?: UserRankingDisplay[];
  isAuthenticated?: boolean;
}

const RankingsTab: React.FC<RankingsTabProps> = ({ 
  userId, 
  userRankings, 
  isAuthenticated = false 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAllRankings, setShowAllRankings] = useState(false);
  
  const { data: rankings, isLoading } = useQuery({
    queryKey: ['user-rankings', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_rankings')
        .select(`
          id, 
          score,
          created_at,
          concursos (
            id, 
            titulo, 
            orgao, 
            banca,
            is_admin_created,
            created_by_user_id
          )
        `)
        .eq('user_id', userId)
        .order('score', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !userRankings && !!userId,
  });
  
  const allRankings = userRankings || rankings;
  const showSkeleton = isLoading && !userRankings;
  
  const sortedRankings = [...(allRankings || [])].sort((a, b) => 
    (typeof b.score === 'number' ? b.score : 0) - (typeof a.score === 'number' ? a.score : 0)
  );
  
  const displayRankings = showAllRankings ? sortedRankings : sortedRankings?.slice(0, 2);
  const hasMoreRankings = sortedRankings?.length > 2;
  
  const isOwnProfile = user?.id === userId;
  
  if (showSkeleton) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  
  if (!allRankings || allRankings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Este usuário ainda não está participando de nenhum ranking.
          </p>
          <Button variant="outline" onClick={() => navigate('/')}>
            Ver concursos disponíveis
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Rankings ({allRankings.length})</h3>
      
      <div className="grid gap-2">
        {displayRankings.map((ranking: any) => {
          const concurso = ranking.concursos;
          const wasCreatedByUser = concurso?.created_by_user_id === userId;
          
          return (
            <Card key={ranking.id} className="overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-white p-4 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center border-b">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold flex items-center">
                    {concurso?.titulo}
                    {wasCreatedByUser && (
                      <Star className="h-4 w-4 ml-2 text-yellow-500" />
                    )}
                  </h4>
                </div>
                
                <div className="flex items-center gap-2 self-end">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex items-center gap-1"
                    onClick={() => navigate(`/concurso/${concurso?.id}/resultados`)}
                  >
                    <Trophy className="h-4 w-4" />
                    <span>Ver Ranking</span>
                  </Button>
                  
                  {isOwnProfile && (
                    <Button
                      size="sm"
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => navigate(`/concurso/${concurso?.id}/participar?showAnswerSheet=true`)}
                    >
                      Editar Respostas
                    </Button>
                  )}
                </div>
              </div>
              
              <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-3 bg-emerald-50 rounded-md text-center">
                  <p className="text-sm font-medium text-gray-600">Pontuação</p>
                  <p className="text-xl font-bold text-emerald-700">{Number(ranking.score || 0).toFixed(1)}</p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-md text-center">
                  <p className="text-sm font-medium text-gray-600">Posição</p>
                  <p className="text-lg font-bold text-gray-700">{Number(ranking.position || 0)}</p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-md text-center hidden sm:block">
                  <p className="text-sm font-medium text-gray-600">Órgão/Banca</p>
                  <p className="text-sm font-medium">
                    {concurso?.orgao} <br />
                    {concurso?.banca}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {hasMoreRankings && (
          <Button 
            variant="ghost" 
            onClick={() => setShowAllRankings(!showAllRankings)}
            className="mt-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          >
            {showAllRankings ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Ver mais rankings ({sortedRankings.length - 2})
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default RankingsTab;
