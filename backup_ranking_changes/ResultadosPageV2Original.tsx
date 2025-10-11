import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RankingCard } from '@/components/resultados/RankingCard';
import ConcursoInfoCard from '@/components/resultados/ConcursoInfoCard';
import { RankingTable } from '@/components/resultados/RankingTable';
import { LoadingState } from '@/components/resultados/LoadingState';
import { useRankingsV2Data } from '@/hooks/useRankingsV2Data';
import { useSecureRankingUrls } from '@/services/rankingUrlObfuscation';
import { RankingService } from '@/services/rankingService';
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

interface ResultadosPageV2OriginalProps {
  rankingId?: string;
  secureToken?: string;
}

const ResultadosPageV2Original: React.FC<ResultadosPageV2OriginalProps> = ({ rankingId, secureToken }) => {
  const navigate = useNavigate();
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const { generateSecureUrl } = useSecureRankingUrls();
  const {
    ranking,
    userRankings,
    participantCount,
    userRanking,
    isLoading,
    isRefetching,
    user,
    refreshData,
    isParticipating,
    error
  } = useRankingsV2Data(rankingId);


  const { toast } = useToast();
  const isAuthenticated = !!user;

  // Converter dados da nova estrutura para o formato esperado pelos componentes originais
  const concurso = ranking ? {
    id: ranking.id,
    titulo: ranking.titulo,
    orgao: ranking.orgao,
    banca: ranking.banca,
    status: ranking.status,
    data_publicacao: ranking.data_publicacao,
    inscritos: ranking.inscritos || 0,
    vagas: ranking.vagas || 0,
    link: ranking.link || '',
    created_at: ranking.created_at,
    updated_at: ranking.updated_at,
    exam_type: ranking.exam_config?.exam_type || 'Alternativas' // Adicionar exam_type
  } : null;

  // Converter userRanking para o formato esperado
  const userRankingFormatted = userRanking ? {
    position: userRanking.position || 0,
    score: parseFloat(userRanking.score) || 0
  } : null;

  // Converter rankings para o formato esperado
  const rankingsFormatted = userRankings.map(ur => ({
    id: ur.id,
    userId: ur.user_id, // Corrigido para userId
    position: ur.position || 0,
    score: parseFloat(ur.score) || 0,
    reservationType: ur.reservation_type || 'Ampla Concorrência', // Corrigido para reservationType
    name: ur.user_name || 'Usuário Desconhecido', // Usando dados do perfil
    avatarUrl: ur.avatar_url || '', // Usando dados do perfil
    // Propriedades adicionais para compatibilidade
    discursiveScore: null,
    caseStudy1Score: null,
    caseStudy2Score: null,
    caseStudy3Score: null,
    weightedDiscursiveScore: null,
    weightedCaseStudy1Score: null,
    weightedCaseStudy2Score: null,
    weightedCaseStudy3Score: null,
    customDisciplineScores: {},
    weightedCustomDisciplineScores: {},
    displayReservation: ur.reservation_type || 'Ampla Concorrência',
    quotaPosition: 0,
    belowMinimum: false,
    belowBlockMinimums: [],
    belowDisciplineMinimums: []
  }));

  const handleRefresh = async () => {
    toast({
      title: "Atualizando ranking",
      description: "As pontuações estão sendo recalculadas em tempo real...",
      duration: 3000
    });
    try {
      await refreshData();
      toast({
        title: "Ranking atualizado",
        description: "As pontuações foram recalculadas e atualizadas com sucesso!",
        duration: 4000
      });
    } catch (error) {
      console.error("Error refreshing ranking:", error);
      toast({
        title: "Erro na atualização",
        description: `Houve um problema ao recalcular as pontuações: ${(error as Error).message}`,
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const handleLeaveRanking = async () => {
    if (!user || !ranking?.id) return;

    setIsLeaving(true);
    try {
      const success = await RankingService.removeUserFromRanking(ranking.id, user.id);
      
      if (success) {
        toast({ title: "Sucesso", description: "Você saiu do ranking.", duration: 3000 });
        setShowLeaveDialog(false);
        await refreshData();
      } else {
        throw new Error("Falha ao remover usuário do ranking");
      }
    } catch (error) {
      console.error("Error leaving ranking:", error);
      toast({ title: "Erro", description: `Falha ao sair do ranking: ${(error as Error).message}`, variant: "destructive" });
    } finally {
      setIsLeaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center text-destructive">
        Erro ao carregar ranking: {error.message}
      </div>
    );
  }

  if (!ranking) {
    return (
      <div className="container mx-auto p-4 text-center text-muted-foreground">
        Ranking não encontrado.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 my-0 py-[5px] px-0">
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        
        
        <div className="flex gap-1 sm:gap-2 flex-wrap">
          <Button onClick={handleRefresh} className="flex items-center gap-2 text-xs sm:text-sm" size="sm" disabled={isRefetching}>
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            {isRefetching ? 'Atualizando...' : 'Atualizar Pontuações'}
          </Button>
          
          {ranking && !isParticipating && user && <Button onClick={async () => {
              const secureUrl = await generateSecureUrl(ranking.id, 'participate');
              navigate(secureUrl);
            }} className="flex items-center gap-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700" size="sm">
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
              Participar
            </Button>}
          
          {ranking && isParticipating && user && <Button onClick={() => setShowLeaveDialog(true)} variant="destructive" className="flex items-center gap-2 text-xs sm:text-sm" size="sm" disabled={isLeaving}>
              <UserMinus className="h-3 w-3 sm:h-4 sm:w-4" />
              Deixar Ranking
            </Button>}
          
          {ranking && !user && <Button onClick={() => navigate('/auth')} className="flex items-center gap-2 text-xs sm:text-sm" size="sm">
              <LogIn className="h-3 w-3 sm:h-4 sm:w-4" />
              Login
            </Button>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-2">
        <RankingCard participantCount={participantCount} userRanking={userRankingFormatted} inscritos={concurso?.inscritos} />
        {concurso && <ConcursoInfoCard concurso={concurso} creatorName="Administrador" />}
      </div>
      
      {isRefetching && <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded-md mb-2 text-center text-sm">
          Atualizando dados em tempo real... As pontuações estão sendo recalculadas.
        </div>}
      
      {/* Sempre exibindo o ranking, independente do status de autenticação */}
      <RankingTable rankings={rankingsFormatted} concurso={concurso} currentUserId={user?.id} isAuthenticated={isAuthenticated} isRefetching={isRefetching} />
      
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
    </div>
  );
};

export default ResultadosPageV2Original;
