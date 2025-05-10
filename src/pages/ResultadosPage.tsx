
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RankingCard } from '@/components/resultados/RankingCard';
import ConcursoInfoCard from '@/components/resultados/ConcursoInfoCard';
import { RankingTable } from '@/components/resultados/RankingTable';
import { LoadingState } from '@/components/resultados/LoadingState';
import { useResultadosData } from '@/hooks/useResultadosData';
import { Button } from '@/components/ui/button';
import { RefreshCw, UserPlus, LogIn } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ResultadosPage = () => {
  const navigate = useNavigate();
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
    inscritos
  } = useResultadosData();
  const {
    toast
  } = useToast();
  const isAuthenticated = !!user;

  useEffect(() => {
    if (concurso) {
      console.log('Concurso data:', concurso);
      console.log('Available quotas:', {
        ampla: concurso.has_ampla_concorrencia,
        ppp: concurso.has_ppp,
        pcd: concurso.has_pcd,
        hipossuficientes: concurso.has_hipossuficientes,
        indigenas: concurso.has_indigenas,
        transsexuais: concurso.has_transsexuais
      });
    }
    if (rankings?.length > 0) {
      console.log('Rankings data:', rankings);
      console.log('Reservation types in rankings:', [...new Set(rankings.map(r => r.reservationType))]);
    }
  }, [concurso, rankings]);

  const handleRefresh = async () => {
    console.log("Manual refresh initiated by user");
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
          
          {concurso && !userRanking && user && <Button onClick={() => navigate(`/concurso/${concurso.id}/participar`)} className="flex items-center gap-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700" size="sm">
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
              Participar
            </Button>}
          
          {concurso && !user && <Button onClick={() => navigate('/auth')} className="flex items-center gap-2 text-xs sm:text-sm" size="sm">
              <LogIn className="h-3 w-3 sm:h-4 sm:w-4" />
              Login
            </Button>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] mb-1 sm:mb-2">
        <RankingCard participantCount={participantCount} userRanking={userRanking} inscritos={concurso?.inscritos} />
        {concurso && <ConcursoInfoCard concurso={concurso} />}
      </div>
      
      {isRefetching && <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded-md mb-2 text-center text-sm">
          Atualizando dados em tempo real... As pontuações estão sendo recalculadas.
        </div>}
      
      {/* Sempre exibindo o ranking, independente do status de autenticação */}
      <RankingTable rankings={rankings} concurso={concurso} currentUserId={user?.id} isAuthenticated={isAuthenticated} isRefetching={isRefetching} />
      
      {!isAuthenticated && <div className="mt-1 sm:mt-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
          <p className="text-center text-gray-600 dark:text-gray-300">
            Para participar deste ranking e comparar seu desempenho, faça login ou crie uma conta.
          </p>
        </div>}
    </div>;
};

export default ResultadosPage;
