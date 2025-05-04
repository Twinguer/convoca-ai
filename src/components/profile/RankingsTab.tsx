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
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [showAllRankings, setShowAllRankings] = useState(false);
  const {
    data: rankings,
    isLoading
  } = useQuery({
    queryKey: ['user-rankings', userId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('user_rankings').select(`
          id, 
          score,
          basic_knowledge_score,
          specific_knowledge_score,
          discursive_score,
          created_at,
          position,
          concursos (id, titulo, orgao, banca)
        `).eq('user_id', userId).order('score', {
        ascending: false
      });
      if (error) throw error;

      // Para cada ranking, calcular a posição real
      const rankingsWithPositions = await Promise.all((data || []).map(async ranking => {
        // Verificar se concursos existe e é um objeto válido
        if (!ranking.concursos || typeof ranking.concursos !== 'object') {
          console.error('Invalid concurso data for ranking:', ranking);
          return {
            ...ranking,
            position: null
          };
        }

        // Buscar pontuações de todos os participantes deste concurso
        const concursoId = ranking.concursos?.id;
        if (!concursoId) {
          console.error('No concurso ID found for ranking:', ranking);
          return {
            ...ranking,
            position: null
          };
        }
        const {
          data: allScores,
          error: scoresError
        } = await supabase.from('user_rankings').select('score').eq('concurso_id', concursoId).order('score', {
          ascending: false
        });
        if (scoresError) {
          console.error('Erro ao buscar pontuações:', scoresError);
          return {
            ...ranking,
            position: null
          };
        }

        // Encontrar a posição do usuário
        const position = allScores ? allScores.findIndex(s => s.score >= ranking.score) + 1 : 0;
        return {
          ...ranking,
          position
        };
      }));
      return rankingsWithPositions || [];
    },
    enabled: !userRankings && !!userId // Only fetch if userRankings is not provided and userId exists
  });

  // Use provided userRankings if available, otherwise use fetched rankings
  const allRankings = userRankings || rankings;
  const showSkeleton = isLoading && !userRankings;

  // Sort rankings by score (highest first)
  const sortedRankings = [...(allRankings || [])].sort((a, b) => (typeof b.score === 'number' ? b.score : 0) - (typeof a.score === 'number' ? a.score : 0));

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
            <div className="bg-gradient-to-r from-emerald-50 to-white p-4 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center border-b">
              <div>
                <h4 className="font-bold text-gray-500">
                  {ranking.concursos?.titulo || ranking.concursoTitle}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {ranking.concursos?.orgao} {ranking.concursos?.banca ? `• ${ranking.concursos.banca}` : ''}
                </p>
                
                {/* Posição e Pontuação */}
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