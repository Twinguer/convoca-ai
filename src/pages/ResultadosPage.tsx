
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
  
  const { toast } = useToast();
  const isAuthenticated = !!user;
  
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
      duration: 2000,
    });
  };
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  return (
    <div className="container mx-auto p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
          <Trophy className="mr-2 h-6 w-6 sm:h-7 sm:w-7 text-yellow-500" />
          {concurso?.titulo ? `${concurso.titulo} - Resultados` : 'Rankings'}
        </h1>
        
        <div className="flex gap-1 sm:gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="flex items-center gap-2 text-xs sm:text-sm"
            size="sm"
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            Atualizar
          </Button>
          
          {concurso && !userRanking && user && (
            <Button 
              onClick={() => navigate(`/concurso/${concurso.id}/participar`)}
              className="flex items-center gap-2 text-xs sm:text-sm"
              size="sm"
            >
              <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
              Participar
            </Button>
          )}
          
          {concurso && !user && (
            <Button 
              onClick={() => navigate(`/auth`)}
              variant="outline"
              className="flex items-center gap-2 text-xs sm:text-sm"
              size="sm"
            >
              <LogIn className="h-3 w-3 sm:h-4 sm:w-4" />
              Fazer Login
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-1 sm:mb-2">
        <RankingCard 
          participantCount={participantCount} 
          userRanking={userRanking} 
        />
        
        {concurso && <ConcursoInfoCard concurso={concurso} />}
      </div>
      
      <RankingTable 
        rankings={rankings} 
        currentUserId={user?.id}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
};

export default ResultadosPage;
