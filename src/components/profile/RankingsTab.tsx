import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { PencilLine, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { UserRankingDisplay } from '@/types/concursos';
import { useAuth } from '@/hooks/useAuth';

interface RankingsTabProps {
  userId: string;
  userRankings?: UserRankingDisplay[];
  isAuthenticated?: boolean;
}

const RankingsTab: React.FC<RankingsTabProps> = ({ userId, userRankings, isAuthenticated = false }) => {
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
          basic_knowledge_score,
          specific_knowledge_score,
          discursive_score,
          created_at,
          concursos (id, titulo, orgao, banca)
        `)
        .eq('user_id', userId)
        .order('score', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !userRankings && !!userId, // Only fetch if userRankings is not provided and userId exists
  });
  
  // Use provided userRankings if available, otherwise use fetched rankings
  const allRankings = userRankings || rankings;
  const showSkeleton = isLoading && !userRankings;
  
  // Sort rankings by score (highest first)
  const sortedRankings = [...(allRankings || [])].sort((a, b) => 
    (typeof b.score === 'number' ? b.score : 0) - (typeof a.score === 'number' ? a.score : 0)
  );
  
  // Display only top 2 if not showing all
  const displayRankings = showAllRankings ? sortedRankings : sortedRankings?.slice(0, 2);
  const hasMoreRankings = sortedRankings?.length > 2;
  
  // Verifica se o usuário atual é o dono do perfil
  const isOwnProfile = user?.id === userId;
  
  if (showSkeleton) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
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
          <Button variant="outline" onClick={() => navigate('/pre-classificacao')}>
            Ver Rankings disponíveis
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Rankings ({allRankings.length})</h3>
      
      <div className="grid gap-1">
        {displayRankings.map((ranking: any) => (
          <Card key={ranking.id || ranking.concursoId} className="overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-white p-4 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center border-b">
              <div>
                <h4 className="font-bold">
                  {ranking.concursos?.titulo || ranking.concursoTitle}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {ranking.concursos?.orgao} {ranking.concursos?.banca ? `• ${ranking.concursos.banca}` : ''}
                </p>
              </div>
              
              <div className="flex items-center gap-2 self-end">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex items-center gap-1"
                  onClick={() => navigate(`/concurso/${ranking.concursos?.id || ranking.concursoId}/resultados`)}
                >
                  <Trophy className="h-4 w-4" />
                  <span>Ver Ranking</span>
                </Button>
                
                {isOwnProfile && (
                  <Button
                    size="sm"
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => navigate(`/concurso/${ranking.concursos?.id || ranking.concursoId}/participar?showAnswerSheet=true`)}
                  >
                    <PencilLine className="h-4 w-4" />
                    <span>Editar Respostas</span>
                  </Button>
                )}
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="text-gray-600">Posição:</div>
                  <div className="font-medium">{ranking.position}º</div>
                  <div className="text-gray-600">Pontuação total:</div>
                  <div className="font-medium">{Number(ranking.score || 0).toFixed(2)}</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Pontuações detalhadas</h5>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {ranking.weightedBasicScore > 0 && (
                      <>
                        <div className="text-gray-600">C.B. (com peso):</div>
                        <div className="font-medium">{ranking.weightedBasicScore.toFixed(2)}</div>
                      </>
                    )}
                    
                    {ranking.weightedSpecific1Score > 0 && (
                      <>
                        <div className="text-gray-600">C.E.1 (com peso):</div>
                        <div className="font-medium">{ranking.weightedSpecific1Score.toFixed(2)}</div>
                      </>
                    )}
                    
                    {ranking.weightedSpecific2Score > 0 && (
                      <>
                        <div className="text-gray-600">C.E.2 (com peso):</div>
                        <div className="font-medium">{ranking.weightedSpecific2Score.toFixed(2)}</div>
                      </>
                    )}
                    
                    {ranking.weightedSpecific3Score > 0 && (
                      <>
                        <div className="text-gray-600">C.E.3 (com peso):</div>
                        <div className="font-medium">{ranking.weightedSpecific3Score.toFixed(2)}</div>
                      </>
                    )}
                    
                    {ranking.weightedDiscursiveScore > 0 && (
                      <>
                        <div className="text-gray-600">Discursiva (com peso):</div>
                        <div className="font-medium">{ranking.weightedDiscursiveScore.toFixed(2)}</div>
                      </>
                    )}
                    
                    {ranking.weightedCaseStudy1Score > 0 && (
                      <>
                        <div className="text-gray-600">Est. Caso 1 (com peso):</div>
                        <div className="font-medium">{ranking.weightedCaseStudy1Score.toFixed(2)}</div>
                      </>
                    )}
                    
                    {ranking.weightedCaseStudy2Score > 0 && (
                      <>
                        <div className="text-gray-600">Est. Caso 2 (com peso):</div>
                        <div className="font-medium">{ranking.weightedCaseStudy2Score.toFixed(2)}</div>
                      </>
                    )}
                    
                    {ranking.weightedCaseStudy3Score > 0 && (
                      <>
                        <div className="text-gray-600">Est. Caso 3 (com peso):</div>
                        <div className="font-medium">{ranking.weightedCaseStudy3Score.toFixed(2)}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
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
