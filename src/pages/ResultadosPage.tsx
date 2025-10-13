
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RankingCard } from '@/components/resultados/RankingCard';
import ConcursoInfoCard from '@/components/resultados/ConcursoInfoCard';
import { RankingTable } from '@/components/resultados/RankingTable';
// import { performanceMonitor } from '@/utils/performanceMonitor'; // Removido - sistema simplificado
import { LoadingState } from '@/components/resultados/LoadingState';
import { useResultadosData } from '@/hooks/useResultadosData';
import { useLeaveRanking } from '@/hooks/useLeaveRanking';
import { Button } from '@/components/ui/button';
import { RefreshCw, UserPlus, LogIn, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { rankingCache } from '@/services/rankingCache';
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
}

const ResultadosPage = ({ rankingId }: ResultadosPageProps = {}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  
  // Usar ID da URL ou prop
  const finalRankingId = rankingId || id;
  
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
    isParticipating
  } = useResultadosData(finalRankingId);
  
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

  const handleRefresh = async () => {
    logger.info('Manual refresh initiated by user for classification', 'RESULTADOS_PAGE');
    console.log('[ResultadosPage] ===== INÍCIO REFRESH MANUAL =====');
    console.log('[ResultadosPage] handleRefresh called - updating classification');
    
    
    try {
      // Limpar cache local para forçar busca de dados frescos
      console.log('[ResultadosPage] 🗑️ Limpando cache local...');
      rankingCache.clear();
      console.log('[ResultadosPage] ✅ Cache local limpo com sucesso');
      
      console.log('[ResultadosPage] Calling refreshData...');
      // Refresh dados do concurso
      const result = await refreshData();
      console.log('[ResultadosPage] refreshData result:', result);
      
      // Forçar atualização adicional dos rankings e contagem
      console.log('[ResultadosPage] Forçando atualização de rankings e contagem...');
      await refetchRankings();
      await refetchCount();
      console.log('[ResultadosPage] ✅ Rankings e contagem atualizados');
      
      if (result?.success) {
        console.log('[ResultadosPage] Success case - showing success toast');
        toast({
          title: "Classificação atualizada",
          description: `Pontuações recalculadas para ${result.updatedCount || 0} usuário(s)!`,
          duration: 4000
        });
      } else if (result?.error) {
        console.log('[ResultadosPage] Error case - showing error toast:', result.error);
        toast({
          title: "Erro na atualização",
          description: `Houve um problema ao recalcular as pontuações: ${result.error}`,
          variant: "destructive",
          duration: 5000
        });
      } else {
        console.log('[ResultadosPage] No result case - showing generic success toast');
        toast({
          title: "Classificação atualizada",
          description: "As pontuações foram recalculadas com sucesso!",
          duration: 3000
        });
      }
      
      console.log('[ResultadosPage] ===== FIM REFRESH MANUAL =====');
    } catch (error) {
      console.error('[ResultadosPage] ===== ERRO NO REFRESH MANUAL =====');
      console.error('[ResultadosPage] Error during refresh:', error);
      logger.error('Error during refresh', 'RESULTADOS_PAGE', error);
      toast({
        title: "Erro na atualização",
        description: "Ocorreu um erro inesperado ao atualizar a classificação.",
        variant: "destructive",
        duration: 5000
      });
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

  if (isLoading) {
    return <LoadingState />;
  }

  return <div className="container mx-auto p-2 sm:p-4 my-0 py-[5px] px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        
        
        <div className="flex gap-1 sm:gap-2 flex-wrap">
          <Button 
            onClick={handleRefresh} 
            className="flex items-center gap-2 text-xs sm:text-sm" 
            size="sm" 
            disabled={isRefetching}
            variant="outline"
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            {isRefetching ? 'Atualizando...' : 'Atualizar Classificação'}
          </Button>
          
          
          {concurso && !isParticipating && user && <Button onClick={() => navigate(`/ranking/${concurso.id}/participate`)} className="flex items-center gap-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700" size="sm">
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
              Participar
            </Button>}
          
          {concurso && isParticipating && user && <Button onClick={() => setShowLeaveDialog(true)} variant="destructive" className="flex items-center gap-2 text-xs sm:text-sm" size="sm" disabled={isLeaving}>
              <UserMinus className="h-3 w-3 sm:h-4 sm:w-4" />
              Deixar Ranking
            </Button>}
          
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
