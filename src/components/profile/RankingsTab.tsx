
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
            <Card key={ranking.id} className="overflow-hidden bg-green-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="font-bold text-md">
                        {concurso?.titulo}
                        {wasCreatedByUser && (
                          <Star className="h-4 w-4 ml-2 text-yellow-500 inline" />
                        )}
                      </h4>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {concurso?.orgao} - {concurso?.banca}
                    </div>
                    <div className="flex items-center mt-2">
                      <Trophy className="h-4 w-4 text-amber-500 mr-1" />
                      <span className="text-sm font-medium">Posição: {ranking.position || '3'}º</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="bg-white rounded-full h-14 w-14 flex items-center justify-center shadow-sm">
                      <span className="text-xl font-bold">{Number(ranking.score || 0).toFixed(0)}</span>
                      <span className="text-xs ml-1">pts</span>
                    </div>
                    
                    <div className="mt-2 flex flex-col gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-xs px-2 py-1 h-auto"
                        onClick={() => navigate(`/concurso/${concurso?.id}/resultados`)}
                      >
                        Ver Ranking
                      </Button>
                      
                      {isOwnProfile && (
                        <Button
                          size="sm"
                          className="text-xs px-2 py-1 h-auto bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => navigate(`/concurso/${concurso?.id}/participar?showAnswerSheet=true`)}
                        >
                          Editar
                        </Button>
                      )}
                    </div>
                  </div>
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
