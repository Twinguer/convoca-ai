
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { PencilLine, Trophy, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import { UserRankingDisplay } from '@/types/concursos';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

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
          basic_knowledge_score,
          specific_knowledge_score,
          discursive_score,
          created_at,
          position,
          concurso_id,
          is_score_recalculated,
          concursos:concurso_id (
            id, 
            titulo, 
            orgao, 
            banca,
            has_minimum_score
          )
        `)
        .eq('user_id', userId)
        .order('score', { ascending: false });
        
      if (error) throw error;

      // Para cada ranking com nota de corte, verificar se o candidato está classificado
      const rankingsWithClassification = await Promise.all((data || []).map(async ranking => {
        // Verificar se o concurso tem nota de corte
        const hasMinimumScore = ranking.concursos?.has_minimum_score || false;
        let isClassified = true; // Por padrão, assume-se que está classificado
        
        if (hasMinimumScore) {
          // Verificar a classificação usando a função
          const { data: classificationData, error: classificationError } = await supabase.rpc(
            'is_candidate_classified',
            {
              p_ranking_id: ranking.id,
              p_concurso_id: ranking.concurso_id
            }
          );
          
          if (classificationError) {
            console.error('Error checking classification:', classificationError);
          } else {
            isClassified = classificationData;
          }
        }
        
        return {
          ...ranking,
          isClassified
        };
      }));

      return rankingsWithClassification || [];
    },
    enabled: !userRankings && !!userId // Only fetch if userRankings is not provided and userId exists
  });

  // Use provided userRankings if available, otherwise use fetched rankings
  const allRankings = userRankings || rankings;
  const showSkeleton = isLoading && !userRankings;

  // Sort rankings by score (highest first)
  const sortedRankings = [...(allRankings || [])].sort((a, b) => 
    (typeof b.score === 'number' ? b.score : 0) - (typeof a.score === 'number' ? a.score : 0));

  // Display only top 2 if not showing all
  const displayRankings = showAllRankings ? sortedRankings : sortedRankings?.slice(0, 2);
  const hasMoreRankings = sortedRankings?.length > 2;

  // Verifica se o usuário atual é o dono do perfil
  const isOwnProfile = user?.id === userId;
  
  if (showSkeleton) {
    return <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>;
  }
  
  if (!allRankings || allRankings.length === 0) {
    return <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Este usuário ainda não está participando de nenhum ranking.
          </p>
          <Button variant="outline" onClick={() => navigate('/pre-classificacao')}>
            Ver Rankings disponíveis
          </Button>
        </CardContent>
      </Card>;
  }
  
  return <div className="space-y-4">
      <h3 className="text-lg font-medium">Rankings ({allRankings.length})</h3>
      
      <div className="grid gap-1">
        {displayRankings.map((ranking: any) => <Card key={ranking.id || ranking.concursoId} className="overflow-hidden">
            <div className={`p-4 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center border-b
              ${ranking.concursos?.has_minimum_score && !ranking.isClassified 
                ? 'bg-gradient-to-r from-gray-50 to-white' 
                : 'bg-gradient-to-r from-emerald-50 to-white'}`}>
              <div>
                <h4 className="font-bold text-gray-500 text-sm truncate max-w-[200px]">
                  {ranking.concursos?.titulo || ranking.concursoTitle}
                </h4>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {ranking.concursos?.orgao} {ranking.concursos?.banca ? `• ${ranking.concursos.banca}` : ''}
                </p>
                
                {/* Status de classificação (exibido se o concurso tiver nota de corte) */}
                {ranking.concursos?.has_minimum_score && (
                  <div className="mt-2">
                    {ranking.isClassified ? (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1 w-fit">
                        <CheckCircle className="h-3 w-3" />
                        <span>Classificado</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 w-fit">
                        <XCircle className="h-3 w-3" />
                        <span>Não classificado</span>
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Pontuação */}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="flex items-center">
                    Pontuação: {typeof ranking.score === 'number' ? ranking.score.toFixed(2) : 'Calculando...'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-end">
                <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={() => navigate(`/concurso/${ranking.concursos?.id || ranking.concursoId}/resultados`)}>
                  <Trophy className="h-4 w-4" />
                  <span>Ver Ranking</span>
                </Button>
                
                {isOwnProfile && <Button size="sm" className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate(`/concurso/${ranking.concursos?.id || ranking.concursoId}/participar?showAnswerSheet=true`)}>
                    <PencilLine className="h-4 w-4" />
                    <span>Editar Respostas</span>
                  </Button>}
              </div>
            </div>
          </Card>)}
        
        {hasMoreRankings && <Button variant="ghost" onClick={() => setShowAllRankings(!showAllRankings)} className="mt-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
            {showAllRankings ? <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Mostrar menos
              </> : <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Ver mais rankings ({sortedRankings.length - 2})
              </>}
          </Button>}
      </div>
    </div>;
};

export default RankingsTab;
