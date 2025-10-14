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
import { getRankingsWithUserInfo } from '@/integrations/supabase/rankings/userRankings';
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
          subject_scores,
          weighted_discursive_score,
          weighted_case_study_1_score,
          weighted_case_study_2_score,
          weighted_case_study_3_score,
          created_at,
          reservation_type,
          concurso_id,
          concursos!inner (
            id,
            titulo,
            orgao,
            banca
          )
        `).eq('user_id', userId).order('score', {
        ascending: false
      });
      if (error) throw error;

      // Para cada ranking, calcular a posição real usando a mesma lógica da comunidade
      const rankingsWithPositions = await Promise.all((data || []).map(async ranking => {
        // Verificar se concursos existe e é um objeto válido
        if (!ranking.concursos || typeof ranking.concursos !== 'object') {
          console.error('Invalid concurso data for ranking');
          return {
            ...ranking,
            position: null
          };
        }
        
        const concursoId = ranking.concurso_id;
        if (!concursoId) {
          console.error('No concurso ID found for ranking');
          return {
            ...ranking,
            position: null,
            isEliminated: false
          };
        }

        try {
          // Usar a mesma função que é usada na página de comunidade
          const list = await getRankingsWithUserInfo(supabase, concursoId);

          // Mesma regra de eliminação usada na tabela de rankings
          const isBelowMinimum = (rankingData: any, concursoData: any) => {
            // Verificação existente para mínimos por disciplina/bloco
            const hasDisciplineMinimums = rankingData.belowDisciplineMinimums && 
              rankingData.belowDisciplineMinimums.length > 0;
            const hasBlockMinimums = rankingData.belowBlockMinimums && 
              rankingData.belowBlockMinimums.length > 0;
            
            // NOVA LÓGICA: Para provas "Certo ou Errado", eliminar se nota <= 0
            const isCertoErradoEliminated = concursoData?.exam_type === 'Certo ou Errado' && 
              rankingData.score <= 0;
            
            // NOVA LÓGICA: Para provas "Alternativas", eliminar se nota <= 0
            const isAlternativasEliminated = concursoData?.exam_type === 'Alternativas' && 
              rankingData.score <= 0;
            
            return !!rankingData.belowMinimum || hasDisciplineMinimums || hasBlockMinimums || 
                   isCertoErradoEliminated || isAlternativasEliminated;
          };

          // Buscar dados do concurso para verificar o tipo de exame
          const { data: concursoData } = await supabase
            .from('concursos')
            .select('exam_type')
            .eq('id', concursoId)
            .single();

          // Filtrar classificados e ordenar por pontuação
          const classified = list.filter((r: any) => !isBelowMinimum(r, concursoData)).sort((a: any, b: any) => b.score - a.score);
          
          // Encontrar a posição do usuário
          const idx = classified.findIndex((r: any) => r.id === ranking.id);
          const isClassified = idx >= 0;
          const position = isClassified ? idx + 1 : null;

          return {
            ...ranking,
            position,
            isEliminated: !isClassified
          };
        } catch (error) {
          console.error('Erro ao calcular posição:', error);
          return {
            ...ranking,
            position: null,
            isEliminated: false
          };
        }
      }));
      return rankingsWithPositions || [];
    },
    enabled: !userRankings && !!userId // Only fetch if userRankings is not provided and userId exists
  });

  // Calcula posições também quando userRankings é passado via props (Meu Perfil > Rankings)
  const { data: propRankingsWithPositions } = useQuery({
    queryKey: ['user-rankings-positions', userId, userRankings],
    queryFn: async () => {
      const list = await Promise.all((userRankings || []).map(async (ranking: any) => {
        const concursoId = ranking.concurso_id || ranking.concursoId;
        if (!concursoId) {
          return { ...ranking, position: null, isEliminated: false };
        }
        try {
          const communityList = await getRankingsWithUserInfo(supabase, concursoId);
          
          // Buscar dados do concurso para verificar o tipo de exame
          const { data: concursoData } = await supabase
            .from('concursos')
            .select('exam_type')
            .eq('id', concursoId)
            .single();
          
          const isBelowMinimum = (r: any) => {
            // Verificação existente para mínimos por disciplina/bloco
            const hasDisciplineMinimums = r.belowDisciplineMinimums && 
              r.belowDisciplineMinimums.length > 0;
            const hasBlockMinimums = r.belowBlockMinimums && 
              r.belowBlockMinimums.length > 0;
            
            // NOVA LÓGICA: Para provas "Certo ou Errado", eliminar se nota <= 0
            const isCertoErradoEliminated = concursoData?.exam_type === 'Certo ou Errado' && 
              r.score <= 0;
            
            // NOVA LÓGICA: Para provas "Alternativas", eliminar se nota <= 0
            const isAlternativasEliminated = concursoData?.exam_type === 'Alternativas' && 
              r.score <= 0;
            
            return !!r.belowMinimum || hasDisciplineMinimums || hasBlockMinimums || 
                   isCertoErradoEliminated || isAlternativasEliminated;
          };
          
          const classified = communityList
            .filter((r: any) => !isBelowMinimum(r))
            .sort((a: any, b: any) => b.score - a.score);
          // Encontrar posição pelo id do ranking específico
          const idx = classified.findIndex((r: any) => r.id === ranking.id);
          const isClassified = idx >= 0;
          const position = isClassified ? idx + 1 : null;
          return { ...ranking, position, isEliminated: !isClassified };
        } catch (e) {
          console.error('Erro ao calcular posição (props):', e);
          return { ...ranking, position: null, isEliminated: false };
        }
      }));
      return list;
    },
    enabled: !!userRankings && !!userId,
  });

  // Lista final considerada: se veio via props, usa a versão enriquecida; caso contrário, os dados buscados
  const allRankings = userRankings ? (propRankingsWithPositions || userRankings) : rankings;
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
      // Log removido por segurança - não expor dados completos do ranking
      
      try {
        const concursoId = ranking.concurso_id || ranking.concursoId;
        const currentUserId = user?.id; // O usuário atual que está saindo
        
        if (!concursoId || !currentUserId) {
          throw new Error('Informações insuficientes - concursoId: ' + concursoId + ', userId: ' + currentUserId);
        }

        // Log removido por segurança

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
        // Log removido por segurança

        // 1. Buscar dados consolidados
        // Log removido por segurança
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
          // Log removido por segurança
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
        // Log removido por segurança
        
        // Deletar score_calculation_logs
        const { error: logsError } = await supabase
          .from('score_calculation_logs')
          .delete()
          .eq('user_ranking_id', rankingId);
        
        if (logsError) {
          console.error('Erro ao deletar score_calculation_logs:', logsError);
        }

        // user_answers não é mais usado - dados estão em consolidated_answers_by_concurso
        // A remoção dos dados consolidados é feita automaticamente via CASCADE

        // Deletar user_ranking
        const { error: rankingError } = await supabase
          .from('user_rankings')
          .delete()
          .eq('id', rankingId);
        
        if (rankingError) {
          console.error('Erro ao deletar user_ranking:', rankingError);
          throw rankingError;
        }

        // Log removido por segurança
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
      
      <div className="grid gap-2">
        {displayRankings.map((ranking: any) => 
          <Card key={ranking.id || ranking.concursoId} className="overflow-hidden">
            <div className="bg-card/80 p-4 flex justify-between items-center border-b border-border">
              <div className="flex-1">
                <h4 className="font-semibold text-card-foreground text-base mb-1">
                  {ranking.concursos?.titulo || ranking.concursoTitle}
                </h4>
                <p className="text-sm text-muted-foreground flex items-center">
                  🏆 Participando - {typeof ranking.score === 'number' ? Math.round(ranking.score) : '0'} pts
                </p>
              </div>
              
              <div className="flex flex-col items-end text-right">
                <div className="text-2xl font-bold text-card-foreground mb-1">
                  {typeof ranking.score === 'number' ? Math.round(ranking.score) : '0'} <span className="text-sm font-normal text-muted-foreground">pts</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="text-muted-foreground mr-1">Classificação:</span>
                  {ranking.isEliminated ? (
                    <span className="text-destructive font-bold">E</span>
                  ) : ranking.position ? (
                    <span className="font-medium">{ranking.position}º</span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-card flex justify-end gap-2">
              <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={() => navigate(`/ranking/${ranking.concursos?.id || ranking.concursoId}`)}>
                <Trophy className="h-4 w-4" />
                <span>Ranking</span>
              </Button>
              
              {isOwnProfile && (
                <>
                  <Button size="sm" className="flex items-center gap-1 bg-primary hover:bg-primary/90" onClick={() => navigate(`/ranking/${ranking.concursos?.id || ranking.concursoId}/participate?showAnswerSheet=true`)}>
                    <PencilLine className="h-4 w-4" />
                    <span>Editar</span>
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" className="flex items-center gap-1">
                        <UserX className="h-4 w-4" />
                        <span>Deixar</span>
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
          </Card>
        )}
        
        {hasMoreRankings && <Button variant="ghost" onClick={() => setShowAllRankings(!showAllRankings)} className="mt-2 text-primary hover:text-primary/80 hover:bg-primary/10">
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