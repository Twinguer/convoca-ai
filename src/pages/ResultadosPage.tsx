
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RankingCard } from '@/components/resultados/RankingCard';
import { ConcursoInfoCard } from '@/components/resultados/ConcursoInfoCard';
import { RankingTable } from '@/components/resultados/RankingTable';
import { LoadingState } from '@/components/resultados/LoadingState';
import { useResultadosData } from '@/hooks/useResultadosData';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trophy, UserPlus, LogIn } from 'lucide-react';
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
  const {
    toast
  } = useToast();
  const isAuthenticated = !!user;

  // Force a refresh of data when component mounts
  useEffect(() => {
    if (concurso?.id) {
      refreshData();
    }
  }, [concurso?.id]);

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

  return <div className="container mx-auto p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center mx-[6px]">
          <Trophy className="mr-2 h-6 w-6 text-yellow-500" />
          {concurso?.titulo ? `${concurso.titulo} - Resultados` : 'Rankings'}
        </h1>
        
        <div className="flex gap-1 sm:gap-2 flex-wrap">
          
          
          {concurso && !userRanking && user && <Button onClick={() => navigate(`/concurso/${concurso.id}/participar`)} className="flex items-center gap-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700" size="sm">
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
              Participar
            </Button>}
          
          {concurso && !user}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-1 sm:mb-2">
        <RankingCard participantCount={participantCount} userRanking={userRanking} />
        
        {concurso && <ConcursoInfoCard concurso={concurso} />}
      </div>
      
      <RankingTable 
        rankings={rankings} 
        concurso={concurso} 
        currentUserId={user?.id} 
        isAuthenticated={isAuthenticated} 
      />
      
      {!isAuthenticated && <div className="mt-1 sm:mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
          <p className="text-center text-gray-600">
            Para participar deste ranking e comparar seu desempenho, faça login ou crie uma conta.
          </p>
        </div>}
    </div>;
};

export default ResultadosPage;
