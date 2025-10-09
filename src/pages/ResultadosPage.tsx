
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RankingCard } from '@/components/resultados/RankingCard';
import ConcursoInfoCard from '@/components/resultados/ConcursoInfoCard';
import { RankingTable } from '@/components/resultados/RankingTable';
import { LoadingState } from '@/components/resultados/LoadingState';
import { useResultadosData } from '@/hooks/useResultadosData';
import { useSecureUrls } from '@/services/urlObfuscation';
import { useLeaveRanking } from '@/hooks/useLeaveRanking';
import { Button } from '@/components/ui/button';
import { RefreshCw, UserPlus, LogIn, UserMinus } from 'lucide-react';
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
} from '@/components/ui/alert-dialog';

interface ResultadosPageProps {
  concursoId?: string;
  secureToken?: string;
}

const ResultadosPage: React.FC<ResultadosPageProps> = ({ concursoId, secureToken }) => {
  const navigate = useNavigate();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const { generateSecureUrl } = useSecureUrls();
  const {
    concurso,
    rankings,
    participantCount,
    userRanking,
    isLoading,
    isRefetching,
    user,
    refreshData,
    creatorName,
    inscritos,
    isParticipating: originalIsParticipating
  } = useResultadosData(concursoId);

  // SOLUÇÃO TEMPORÁRIA: Verificar se o usuário está realmente participando
  // baseado nos dados do ranking (que sabemos que funcionam)
  const isParticipating = originalIsParticipating || (userRanking && userRanking.id);
  const { toast } = useToast();
  const { leave, isLeaving } = useLeaveRanking();
  const isAuthenticated = !!user;

  // Efeito removido para evitar re-renderizações desnecessárias

  const handleRefresh = async () => {
    // Log removido por segurança
    toast({
      title: "Atualizando ranking",
      description: "As pontuações estão sendo recalculadas em tempo real...",
      duration: 3000
    });
    const result = await refreshData();
    if (result?.success) {
      toast({
        title: "Ranking atualizado",
        description: `As pontuações foram recalculadas com sucesso para ${result.updatedCount} usuário(s)!`,
        duration: 4000
      });
    } else if (result?.error) {
      toast({
        title: "Erro na atualização",
        description: `Houve um problema ao recalcular as pontuações: ${result.error}`,
        variant: "destructive",
        duration: 5000
      });
    } else {
      toast({
        title: "Ranking atualizado",
        description: "As pontuações foram recalculadas com sucesso!",
        duration: 3000
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
          <Button onClick={handleRefresh} className="flex items-center gap-2 text-xs sm:text-sm" size="sm" disabled={isRefetching}>
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            {isRefetching ? 'Atualizando...' : 'Atualizar Pontuações'}
          </Button>
          
          {concurso && !isParticipating && user && <Button onClick={async () => {
              const secureUrl = await generateSecureUrl(concurso.id, 'participar');
              navigate(secureUrl);
            }} className="flex items-center gap-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700" size="sm">
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
      
      {isRefetching && <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded-md mb-2 text-center text-sm">
          Atualizando dados em tempo real... As pontuações estão sendo recalculadas.
        </div>}
      
      {/* Sempre exibindo o ranking, independente do status de autenticação */}
      <RankingTable rankings={rankings} concurso={concurso} currentUserId={user?.id} isAuthenticated={isAuthenticated} isRefetching={isRefetching} />
      
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
