
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { PencilLine, Trophy, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { UserRankingDisplay } from '@/types/concursos';
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
import { useAuth } from '@/hooks/useAuth';

interface RankingsTabProps {
  userId: string;
  userRankings?: UserRankingDisplay[];
  isAuthenticated?: boolean;
}

const RankingsTab: React.FC<RankingsTabProps> = ({ userId, userRankings, isAuthenticated = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAllRankings, setShowAllRankings] = useState(false);
  const [rankingToDelete, setRankingToDelete] = useState<string | null>(null);
  
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
          concursos(id, titulo, orgao, banca)
        `)
        .eq('user_id', userId)
        .order('score', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !userRankings && !!userId, // Only fetch if userRankings is not provided and userId exists
  });
  
  // Mutation para sair do ranking
  const leaveRankingMutation = useMutation({
    mutationFn: async (rankingId: string) => {
      try {
        // Primeiro exclui as respostas do usuário
        const { error: answersError } = await supabase
          .from('user_answers')
          .delete()
          .eq('user_ranking_id', rankingId);
        
        if (answersError) throw answersError;
        
        // Depois exclui o ranking do usuário
        const { error: rankingError } = await supabase
          .from('user_rankings')
          .delete()
          .eq('id', rankingId)
          .eq('user_id', userId);
        
        if (rankingError) throw rankingError;
        
        return rankingId;
      } catch (error) {
        console.error('Error in leaveRankingMutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-rankings', userId] });
      toast({
        title: "Ranking removido",
        description: "Você saiu deste ranking com sucesso.",
        duration: 3000, // Reduzir tempo de exibição do toast
      });
      setRankingToDelete(null);
    },
    onError: (error) => {
      console.error('Erro ao sair do ranking:', error);
      toast({
        title: "Erro ao sair do ranking",
        description: "Ocorreu um erro ao tentar sair do ranking. Tente novamente.",
        variant: "destructive",
        duration: 3000, // Reduzir tempo de exibição do toast
      });
    }
  });
  
  const handleLeaveRanking = (rankingId: string) => {
    if (user?.id !== userId) {
      toast({
        title: "Operação não permitida",
        description: "Você só pode remover seus próprios rankings.",
        variant: "destructive",
        duration: 3000, // Reduzir tempo de exibição do toast
      });
      return;
    }
    
    leaveRankingMutation.mutate(rankingId);
  };
  
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
                {isOwnProfile && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => setRankingToDelete(ranking.id || ranking.concursoId)}
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Sair</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Sair do Ranking</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja sair deste ranking? Todas as suas respostas serão excluídas e você perderá sua posição atual.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleLeaveRanking(ranking.id || ranking.concursoId)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {leaveRankingMutation.isPending ? 'Saindo...' : 'Sair do Ranking'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                
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
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-1">
                <div className="p-3 bg-emerald-50 rounded-md text-center">
                  <p className="text-sm font-medium text-gray-600">Pontuação Total</p>
                  <p className="text-xl font-bold text-emerald-700">{ranking.score || 0}</p>
                </div>
                
                {(ranking.basic_knowledge_score !== undefined) && (
                  <div className="p-3 bg-gray-50 rounded-md text-center">
                    <p className="text-sm font-medium text-gray-600">Conhecimentos Básicos</p>
                    <p className="text-lg font-bold text-gray-700">{ranking.basic_knowledge_score || 0}</p>
                  </div>
                )}
                
                {(ranking.specific_knowledge_score !== undefined) && (
                  <div className="p-3 bg-gray-50 rounded-md text-center">
                    <p className="text-sm font-medium text-gray-600">Conhecimentos Específicos</p>
                    <p className="text-lg font-bold text-gray-700">{ranking.specific_knowledge_score || 0}</p>
                  </div>
                )}
                
                {(ranking.discursive_score !== undefined) && (
                  <div className="p-3 bg-gray-50 rounded-md text-center">
                    <p className="text-sm font-medium text-gray-600">Discursiva/Estudo de Caso</p>
                    <p className="text-lg font-bold text-gray-700">{ranking.discursive_score || 0}</p>
                  </div>
                )}
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
