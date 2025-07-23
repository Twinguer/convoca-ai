import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { PencilLine, Trophy, ChevronDown, ChevronUp, UserX } from 'lucide-react';
import { UserRankingDisplay } from '@/types/concursos';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
          concurso_id,
          concursos:concurso_id (id, titulo, orgao, banca)
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
        const concursoId = ranking.concurso_id;
        if (!concursoId) {
          console.error('No concurso ID found for ranking:', ranking);
          return {
            ...ranking,
            position: null,
            isEliminated: false
          };
        }

        // Verificar se o usuário está classificado (não eliminado)
        const { data: isClassified, error: classifiedError } = await supabase
          .rpc('is_candidate_classified', {
            p_ranking_id: ranking.id,
            p_concurso_id: concursoId
          });

        if (classifiedError) {
          console.error('Erro ao verificar classificação:', classifiedError);
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
            position: null,
            isEliminated: !isClassified
          };
        }

        // Encontrar a posição do usuário
        const position = allScores ? allScores.findIndex(s => s.score >= ranking.score) + 1 : 0;
        return {
          ...ranking,
          position: !isClassified ? null : position,
          isEliminated: !isClassified
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

  // Mutation para deixar de participar do ranking
  const leaveRankingMutation = useMutation({
    mutationFn: async (ranking: any) => {
      console.log('DEBUG: Estrutura completa do ranking recebido:', JSON.stringify(ranking, null, 2));
      
      try {
        const concursoId = ranking.concurso_id || ranking.concursoId;
        const currentUserId = user?.id; // O usuário atual que está saindo
        
        if (!concursoId || !currentUserId) {
          throw new Error('Informações insuficientes - concursoId: ' + concursoId + ', userId: ' + currentUserId);
        }

        console.log('Buscando ranking do usuário para concurso:', concursoId, 'usuário:', currentUserId);

        // Primeiro buscar o ID do user_ranking
        const { data: userRanking, error: findError } = await supabase
          .from('user_rankings')
          .select('id')
          .eq('concurso_id', concursoId)
          .eq('user_id', currentUserId)
          .single();

        if (findError || !userRanking) {
          console.error('Erro ao buscar ranking do usuário:', findError);
          throw new Error('Ranking do usuário não encontrado');
        }

        const rankingId = userRanking.id;
        console.log('ID do ranking encontrado:', rankingId);

        // 1. Buscar dados consolidados
        console.log('Buscando dados consolidados...');
        const { data: consolidatedData, error: fetchError } = await supabase
          .from('consolidated_answers_by_concurso')
          .select('consolidated_data')
          .eq('concurso_id', concursoId)
          .single();
        
        if (fetchError) {
          console.error('Erro ao buscar dados consolidados:', fetchError);
          throw fetchError;
        }

        // 2. Remover usuário do JSON consolidado
        if (consolidatedData?.consolidated_data?.users) {
          console.log('Removendo usuário dos dados consolidados...');
          const updatedData = { ...consolidatedData.consolidated_data };
          delete updatedData.users[currentUserId];
          
          // Atualizar metadados
          updatedData.metadata = {
            ...updatedData.metadata,
            total_users: Object.keys(updatedData.users).length,
            last_updated: new Date().toISOString()
          };

          // Atualizar dados consolidados
          const { error: updateError } = await supabase
            .from('consolidated_answers_by_concurso')
            .update({ consolidated_data: updatedData })
            .eq('concurso_id', concursoId);
          
          if (updateError) {
            console.error('Erro ao atualizar dados consolidados:', updateError);
            throw updateError;
          }
        }

        // 3. Deletar das tabelas relacionadas
        console.log('Deletando dados relacionados...');
        
        // Deletar score_calculation_logs
        const { error: logsError } = await supabase
          .from('score_calculation_logs')
          .delete()
          .eq('user_ranking_id', rankingId);
        
        if (logsError) {
          console.error('Erro ao deletar score_calculation_logs:', logsError);
        }

        // Deletar user_answers
        const { error: answersError } = await supabase
          .from('user_answers')
          .delete()
          .eq('user_ranking_id', rankingId);
        
        if (answersError) {
          console.error('Erro ao deletar user_answers:', answersError);
        }

        // Deletar user_ranking
        const { error: rankingError } = await supabase
          .from('user_rankings')
          .delete()
          .eq('id', rankingId);
        
        if (rankingError) {
          console.error('Erro ao deletar user_ranking:', rankingError);
          throw rankingError;
        }

        console.log('Usuário saiu do ranking com sucesso');
        return { success: true };
      } catch (error) {
        console.error('Erro ao sair do ranking:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Você deixou de participar do ranking.",
      });
      queryClient.invalidateQueries({ queryKey: ['user-rankings', userId] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao deixar de participar do ranking. Tente novamente.",
        variant: "destructive",
      });
      console.error('Erro ao deixar de participar:', error);
    }
  });
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
                <h4 className="font-bold text-gray-500 text-sm truncate max-w-[200px]">
                  {ranking.concursos?.titulo || ranking.concursoTitle}
                </h4>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {ranking.concursos?.orgao} {ranking.concursos?.banca ? `• ${ranking.concursos.banca}` : ''}
                </p>
                
                {/* Posição e Pontuação */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {ranking.isEliminated ? (
                    <Badge variant="destructive" className="flex items-center">
                      Eliminado
                    </Badge>
                  ) : ranking.position ? (
                    <Badge variant="default" className="flex items-center">
                      <Trophy className="h-3 w-3 mr-1" />
                      {ranking.position}º lugar
                    </Badge>
                  ) : null}
                  
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
                
                {isOwnProfile && (
                  <>
                    <Button size="sm" className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate(`/concurso/${ranking.concursos?.id || ranking.concursoId}/participar?showAnswerSheet=true`)}>
                      <PencilLine className="h-4 w-4" />
                      <span>Editar Respostas</span>
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="flex items-center gap-1">
                          <UserX className="h-4 w-4" />
                          <span>Deixar de Participar</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deixar de participar?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deixar de participar deste ranking? Esta ação não pode ser desfeita e você perderá todas as suas respostas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => leaveRankingMutation.mutate(ranking)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
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