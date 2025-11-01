// @ts-nocheck

import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RankingCard } from '@/components/resultados/RankingCard';
import ConcursoInfoCard from '@/components/resultados/ConcursoInfoCard';
import { RankingTable } from '@/components/resultados/RankingTable';
// import { performanceMonitor } from '@/utils/performanceMonitor'; // Removido - sistema simplificado
import { LoadingState } from '@/components/resultados/LoadingState';
import { useResultadosData } from '@/hooks/useResultadosData';
import { useLeaveRanking } from '@/hooks/useLeaveRanking';
import { Button } from '@/components/ui/button';
import { RefreshCw, UserPlus, LogIn, UserMinus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { rankingCache } from '@/services/rankingCache';
import { ProFeatureGuard } from '@/components/Subscription/ProFeatureGuard';
import { toast as sonnerToast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ResultadosPageProps {
  rankingId?: string;
  concursoId?: string;
  secureToken?: string; // Prop opcional para evitar erro de tipo
}

const ResultadosPage = ({ rankingId, concursoId }: ResultadosPageProps = {}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const { isPro, isLoading: isLoadingSubscription } = useSubscription();
  const { currentRankingCount } = usePlanLimits();
  const [canAccessRanking, setCanAccessRanking] = useState<boolean | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const toastShownRef = useRef(false);
  
  // Usar ID da URL ou prop
  const finalRankingId = rankingId || concursoId || id;
  
  // Hook principal para dados do concurso e informações básicas
  const {
    concurso,
    rankings,
    participantCount,
    userRanking,
    isLoading: isLoadingConcurso,
    isRefetching,
    user,
    refreshData,
    refetchRankings,
    refetchCount,
    creatorName,
    inscritos,
    isParticipating,
    isRecalculating,
    recalculationProgress
  } = useResultadosData(finalRankingId);

  // Verificar acesso para usuários Free
  useEffect(() => {
    const checkAccess = async () => {
      // Se for Pro ou não autenticado, permite acesso
      if (isPro || !user || isLoadingSubscription) {
        setCanAccessRanking(true);
        setIsCheckingAccess(false);
        return;
      }

      // Para usuários Free, verificar se participa
      try {
        const { data: userRankingData, error } = await supabase
          .from('user_rankings')
          .select('consolidated_data')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Erro ao verificar participação:', error);
          setCanAccessRanking(true); // Em caso de erro, permite acesso
          setIsCheckingAccess(false);
          return;
        }

        // Verificar se participa deste ranking específico
        let isParticipatingThisRanking = false;
        if (userRankingData?.consolidated_data?.rankings) {
          Object.values(userRankingData.consolidated_data.rankings).forEach((rankingData: any) => {
            if (rankingData.concurso_id === finalRankingId) {
              isParticipatingThisRanking = true;
            }
          });
        }

        if (isParticipatingThisRanking) {
          // Participa, pode ver
          setCanAccessRanking(true);
        } else {
          // Não participa, bloquear acesso
          setCanAccessRanking(false);
        }
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        setCanAccessRanking(true); // Em caso de erro, permite acesso
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [user, isPro, isLoadingSubscription, finalRankingId]);
  
  // Usar rankings do hook principal
  const paginatedRankings = rankings;
  const isLoadingRankings = isLoadingConcurso;

  // Debug: verificar se o ID está sendo passado
  useEffect(() => {
    logger.info('ResultadosPage debug', 'RESULTADOS_PAGE', {
      finalRankingId,
      paginatedRankingsLength: paginatedRankings.length,
      isLoadingRankings
    });
  }, [finalRankingId, paginatedRankings.length, isLoadingRankings]);
  
  const { toast } = useToast();
  const { leave, isLeaving } = useLeaveRanking();
  const isAuthenticated = !!user;
  
  // Estado de loading combinado
  const isLoading = isLoadingConcurso || isLoadingRankings;

  useEffect(() => {
    if (concurso) {
      logger.info('Concurso data loaded', 'RESULTADOS_PAGE', {
        concursoId: concurso.id,
        titulo: concurso.titulo,
        quotas: {
          ampla: concurso.has_ampla_concorrencia,
          ppp: concurso.has_ppp,
          pcd: concurso.has_pcd,
          hipossuficientes: concurso.has_hipossuficientes,
          indigenas: concurso.has_indigenas,
          transsexuais: concurso.has_transsexuais
        },
        disciplinesCount: concurso.disciplines?.length || 0
      });
    }
    if (paginatedRankings?.length > 0) {
      logger.info('Rankings loaded', 'RESULTADOS_PAGE', {
        count: paginatedRankings.length,
        reservationTypes: [...new Set(paginatedRankings.map(r => r.reservationType))]
      });
    }
    
    logger.info('User participation status', 'RESULTADOS_PAGE', { 
      isAuthenticated, 
      isParticipating, 
      userRankingExists: !!userRanking 
    });
  }, [concurso, paginatedRankings, isAuthenticated, isParticipating, userRanking]);

  // Estado para controlar debounce
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  
  const handleRefresh = async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    
    // Debounce: evitar múltiplas execuções em menos de 3 segundos
    if (isRefreshing || timeSinceLastRefresh < 3000) {
      toast({
        title: "Aguarde",
        description: "Recálculo já em andamento. Aguarde alguns segundos.",
        variant: "destructive",
        duration: 2000
      });
      return;
    }
    
    setIsRefreshing(true);
    setLastRefreshTime(now);
    
    logger.info('Manual refresh initiated by user for classification', 'RESULTADOS_PAGE');
    
    try {
      // Limpar cache local para forçar busca de dados frescos
      rankingCache.clear();
      
      // Atualizar dados (agora com recálculo de scores)
      const result = await refreshData();
      
      if (result?.error) {
        toast({
          title: "Erro na atualização",
          description: `Houve um problema ao atualizar: ${result.error}`,
          variant: "destructive",
          duration: 5000
        });
        return;
      }
      
      // Mensagem de sucesso com informação de participantes recalculados
      const participantsInfo = result?.participantsRecalculated 
        ? ` (${result.participantsRecalculated} participantes recalculados)`
        : '';
      
      toast({
        title: "Classificação atualizada",
        description: `Os dados da classificação foram atualizados com sucesso${participantsInfo}.`,
        duration: 3000
      });
      
    } catch (error) {
      logger.error('Error during refresh', 'RESULTADOS_PAGE', error);
      toast({
        title: "Erro na atualização",
        description: "Ocorreu um erro inesperado ao atualizar a classificação.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLeaveRanking = () => {
    if (!concurso) return;
    leave(concurso.id, {
      onSuccess: () => {
        setShowLeaveDialog(false);
        refreshData();
      }
    });
  };

  // Bloquear acesso para usuários Free que não participam
  useEffect(() => {
    if (user && !isPro && canAccessRanking === false && !toastShownRef.current) {
      const hasAnyRanking = currentRankingCount > 0;
      
      if (hasAnyRanking) {
        toastShownRef.current = true;
        showProRequiredToast(navigate, 'Visualizar Rankings que Você Não Participa');
      }
    }
  }, [user, isPro, canAccessRanking, currentRankingCount, navigate]);

  if (isLoading || isCheckingAccess || isLoadingSubscription) {
    return <LoadingState />;
  }

  if (user && !isPro && canAccessRanking === false) {
    const hasAnyRanking = currentRankingCount > 0;
    
    if (hasAnyRanking) {
      return <LoadingState />;
    } else {
      // Não tem nenhum ranking, redirecionar para participar
      sonnerToast.info('Você precisa participar deste ranking para visualizá-lo.', {
        duration: 3000
      });
      navigate(`/ranking/${finalRankingId}/participate`);
      return <LoadingState />;
    }
  }

  return <div className="container mx-auto p-2 sm:p-4 my-0 py-[5px] px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        
        
        <div className="flex gap-1 sm:gap-2 flex-wrap">
          <Button 
            onClick={handleRefresh} 
            className="flex items-center gap-2 text-xs sm:text-sm" 
            size="sm" 
            disabled={isRefetching || isRecalculating || isRefreshing}
            variant="outline"
          >
            {isRecalculating ? (
              <>
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                Recalculando... {recalculationProgress?.current}/{recalculationProgress?.total}
              </>
            ) : isRefetching || isRefreshing ? (
              <>
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                Atualizar Classificação
              </>
            )}
          </Button>
          
          
          {concurso && !isParticipating && user && <Button onClick={() => navigate(`/ranking/${concurso.id}/participate`)} className="flex items-center gap-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700" size="sm">
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
              Participar
            </Button>}
          
          {concurso && isParticipating && user && (
            <Button onClick={() => setShowLeaveDialog(true)} variant="destructive" className="flex items-center gap-2 text-xs sm:text-sm" size="sm" disabled={isLeaving}>
              <UserMinus className="h-3 w-3 sm:h-4 sm:w-4" />
              Deixar Ranking
            </Button>
          )}
          
          {concurso && !user && <Button onClick={() => navigate('/auth')} className="flex items-center gap-2 text-xs sm:text-sm" size="sm">
              <LogIn className="h-3 w-3 sm:h-4 sm:w-4" />
              Login
            </Button>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-2">
        <RankingCard participantCount={participantCount} userRanking={userRanking} inscritos={concurso?.inscritos} />
        {concurso && <ConcursoInfoCard concurso={concurso} creatorName={creatorName} />}
      </div>
      
      
      {/* Sempre exibindo o ranking, independente do status de autenticação */}
      <RankingTable 
        rankings={paginatedRankings} 
        concurso={concurso} 
        currentUserId={user?.id} 
        isAuthenticated={isAuthenticated} 
        isRefetching={isRefetching}
      />
      {/* Debug logs removed for security */}
      
      {!isAuthenticated && <div className="mt-1 sm:mt-2 bg-secondary/50 p-3 rounded-lg border border-border text-sm">
          <p className="text-center text-muted-foreground">
            Para participar deste ranking e comparar seu desempenho, faça login ou crie uma conta.
          </p>
        </div>}
      
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair do Ranking?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja sair deste ranking? Todas as suas respostas e pontuações serão permanentemente removidas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveRanking} className="bg-destructive hover:bg-destructive/90">
              {isLeaving ? 'Saindo...' : 'Sair do Ranking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};

export default ResultadosPage;
