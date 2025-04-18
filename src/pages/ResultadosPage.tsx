
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RankingCard } from '@/components/resultados/RankingCard';
import { ConcursoInfoCard } from '@/components/resultados/ConcursoInfoCard';
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
    user,
    refreshData
  } = useResultadosData();
  
  const { toast } = useToast();
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

  // Force a refresh of data when component mounts
  useEffect(() => {
    if (concurso?.id) {
      refreshData();
    }
  }, [concurso?.id, refreshData]);
  
  const handleRefresh = () => {
    refreshData();
    toast({
      title: "Atualizando ranking",
      description: "Os dados estão sendo atualizados...",
      duration: 2000
    });
  };
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  return (
    <div className="container mx-auto p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center mx-[6px]">
          {concurso?.titulo ? `${concurso.titulo} - Resultados` : 'Rankings'}
        </h1>
        
        <div className="flex gap-1 sm:gap-2 flex-wrap">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            Atualizar
          </Button>
          
          {concurso && !userRanking && user && (
            <Button 
              onClick={() => navigate(`/concurso/${concurso.id}/participar`)} 
              className="flex items-center gap-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700" 
              size="sm"
            >
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
              Participar
            </Button>
          )}
          
          {concurso && !user && (
            <Button 
              onClick={() => navigate('/auth')} 
              className="flex items-center gap-2 text-xs sm:text-sm" 
              size="sm"
            >
              <LogIn className="h-3 w-3 sm:h-4 sm:w-4" />
              Login
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-1 sm:mb-2">
        <RankingCard 
          participantCount={participantCount} 
          userRanking={userRanking}
          inscritos={concurso?.inscritos} 
        />
        
        {concurso && <ConcursoInfoCard concurso={concurso} />}
      </div>
      
      <RankingTable
        rankings={rankings}
        concurso={concurso}
        currentUserId={user?.id}
        isAuthenticated={isAuthenticated}
      />
      
      {!isAuthenticated && (
        <div className="mt-1 sm:mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
          <p className="text-center text-gray-600">
            Para participar deste ranking e comparar seu desempenho, faça login ou crie uma conta.
          </p>
        </div>
      )}
    </div>
  );
};

export default ResultadosPage;
