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
// ✅ REMOVIDO: useSubscription não é mais necessário - verificação no backend
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useSubscription } from '@/hooks/useSubscription';
import { logger } from '@/utils/logger';
import { devLog } from '@/utils/productionLogger';
import { supabase } from '@/integrations/supabase/client';
import { rankingCache } from '@/services/rankingCache';
import { ProFeatureGuard } from '@/components/Subscription/ProFeatureGuard';
import { showProRequiredToast } from '@/utils/planRestrictions';
import { toast as sonnerToast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Lock, Info } from 'lucide-react';
import { UrlObfuscationService } from '@/services/urlObfuscation';
// ✅ REMOVIDO: showProRequiredToast não é mais necessário - rankings são públicos
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
  const { currentRankingCount } = usePlanLimits();
  const { isPro } = useSubscription();
  const [canViewRanking, setCanViewRanking] = useState<boolean | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const toastShownRef = useRef(false);
  
  // Usar ID da URL ou prop
  const finalRankingId = rankingId || concursoId || id;
  const isLegacyRouteAccess = Boolean(id && !secureToken && !rankingId && !concursoId);
  const safeRankingId = isLegacyRouteAccess ? undefined : finalRankingId;
  
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
  } = useResultadosData(safeRankingId, { allowUrlFallback: !isLegacyRouteAccess });

  if (isLegacyRouteAccess) {
    return (
      <div className="p-6 rounded-lg shadow-sm border border-border bg-muted/30">
        <Alert variant="destructive">
          <AlertTitle>Acesso bloqueado</AlertTitle>
          <AlertDescription>
            Para visualizar rankings é necessário utilizar um link seguro com token válido. 
            Esse caminho não está mais disponível por motivos de segurança.
          </AlertDescription>
        </Alert>
        <Button
          className="mt-4 bg-emerald-600 hover:bg-emerald-700"
          onClick={() => navigate('/pre-classificacao')}
        >
          Voltar para pré-classificação
        </Button>
      </div>
    );
  }

  // ✅ Verificar se usuário Free pode ver a classificação
  // Free users só podem ver classificação se participam ou criaram o ranking
  // EXCEÇÃO: Rankings em modo vitrine podem ser visualizados por qualquer usuário
  useEffect(() => {
    const checkAccess = async () => {
      if (!concurso || !user) {
        // Se não há concurso ou usuário, permitir visualização (usuário não autenticado pode ver)
        setCanViewRanking(true);
        setIsCheckingAccess(false);
        return;
      }

      // ✅ MODE VITRINE: Se o ranking está em modo vitrine, permitir visualização para todos
      if (concurso.is_showcase === true) {
        setCanViewRanking(true);
        setIsCheckingAccess(false);
        devLog.log('[ResultadosPage] Acesso permitido: ranking em modo vitrine');
        return;
      }

      // Se for Pro, sempre pode ver
      if (isPro) {
        setCanViewRanking(true);
        setIsCheckingAccess(false);
        return;
      }

      // Para Free users, verificar se participa ou criou
      try {
        // Verificar se criou o ranking
        const { data: concursoData } = await supabase
          .from('concursos')
          .select('created_by_user_id')
          .eq('id', concurso.id)
          .maybeSingle();

        const isCreator = concursoData?.created_by_user_id === user.id;

        // Se criou, pode ver
        if (isCreator) {
          setCanViewRanking(true);
          setIsCheckingAccess(false);
          return;
        }

        // Verificar se participa
        if (isParticipating) {
          setCanViewRanking(true);
          setIsCheckingAccess(false);
          return;
        }

        // Não participa e não criou - não pode ver classificação
        setCanViewRanking(false);
        setIsCheckingAccess(false);
      } catch (error) {
        devLog.error('Erro ao verificar acesso à classificação:', error);
        // Em caso de erro, permitir visualização (não bloquear)
        setCanViewRanking(true);
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [concurso, user, isPro, isParticipating]);
  
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

  if (isLoading || isCheckingAccess) {
    return <LoadingState />;
  }

  // ✅ BLOQUEIO PARA USUÁRIOS FREE: Não podem ver classificação se não participam e não criaram
  // ✅ Não mostrar alerta de acesso restrito se o ranking estiver em modo vitrine
  if (canViewRanking === false && user && !concurso?.is_showcase) {
    return (
      <div className="page-content-container">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
          <div className="flex gap-1 sm:gap-2 flex-wrap">
            <Button 
              onClick={async () => {
                if (!concurso?.id) return;
                try {
                  const token = await UrlObfuscationService.generateConcursoToken(concurso.id);
                  navigate(`/concurso/participar/${token}`);
                } catch (error) {
                  devLog.error('Erro ao gerar token seguro:', error);
                  toast({
                    title: "Erro",
                    description: "Não foi possível gerar link seguro. Tente novamente.",
                    variant: "destructive"
                  });
                }
              }} 
              className="flex items-center gap-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700" 
              size="sm"
            >
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
              Participar do Ranking
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-2">
          <RankingCard participantCount={participantCount} userRanking={userRanking} inscritos={concurso?.inscritos} />
          {concurso && <ConcursoInfoCard concurso={concurso} creatorName={creatorName} />}
        </div>

        <Alert variant="destructive" className="mt-4">
          <Lock className="h-4 w-4" />
          <AlertTitle>Acesso Restrito</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              Usuários Free só podem visualizar a classificação de rankings que participam ou criaram.
            </p>
            <p className="mb-3">
              Você pode participar de até <strong>2 rankings que não criou</strong> ou participar de <strong>todos os rankings que criar</strong>.
            </p>
            <div className="flex gap-2 mt-3">
              <Button 
                onClick={async () => {
                  if (!concurso?.id) return;
                  try {
                    const token = await UrlObfuscationService.generateConcursoToken(concurso.id);
                    navigate(`/concurso/participar/${token}`);
                  } catch (error) {
                    devLog.error('Erro ao gerar token seguro:', error);
                    toast({
                      title: "Erro",
                      description: "Não foi possível gerar link seguro. Tente novamente.",
                      variant: "destructive"
                    });
                  }
                }} 
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Participar do Ranking
              </Button>
              <Button 
                onClick={() => showProRequiredToast(navigate, 'Visualizar Classificações Ilimitadas')} 
                size="sm"
                variant="outline"
              >
                Assinar Plano Pro
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <div className="page-content-container">
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
          
          
          {concurso && !isParticipating && user && !concurso.is_showcase && (() => {
            devLog.log('[ResultadosPage] Botão Participar - condições:', {
              temConcurso: !!concurso,
              isParticipating,
              temUser: !!user,
              isShowcase: concurso.is_showcase,
              deveMostrar: !concurso.is_showcase
            });
            return (
            <Button onClick={async () => {
              if (!concurso.id) return;
              try {
                const token = await UrlObfuscationService.generateConcursoToken(concurso.id);
                navigate(`/concurso/participar/${token}`);
              } catch (error) {
                devLog.error('Erro ao gerar token seguro:', error);
                toast({
                  title: "Erro",
                  description: "Não foi possível gerar link seguro. Tente novamente.",
                  variant: "destructive"
                });
              }
            }} className="flex items-center gap-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700" size="sm">
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
              Participar
            </Button>
            );
          })()}
          
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
      
      {/* Aviso de modo vitrine */}
      {concurso?.is_showcase === true && (
        <Alert className="mt-1 sm:mt-2">
          <Info className="h-4 w-4" />
          <AlertTitle>Modo Vitrine</AlertTitle>
          <AlertDescription>
            Este ranking está em modo demonstração. Você pode visualizar os resultados, mas novos cadastros não são permitidos.
          </AlertDescription>
        </Alert>
      )}
      
      
      {!isAuthenticated && !concurso?.is_showcase && <div className="mt-1 sm:mt-2 bg-secondary/50 p-3 rounded-lg border border-border text-sm">
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
