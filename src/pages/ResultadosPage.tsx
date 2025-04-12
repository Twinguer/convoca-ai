
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RankingCard } from '@/components/resultados/RankingCard';
import { ConcursoInfoCard } from '@/components/resultados/ConcursoInfoCard';
import { RankingTable } from '@/components/resultados/RankingTable';
import { LoadingState } from '@/components/resultados/LoadingState';
import { useResultadosData } from '@/hooks/useResultadosData';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trophy, UserPlus, LogIn } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Force a refresh of data when component mounts
  useEffect(() => {
    if (concurso?.id) {
      refreshData();
    }
  }, [concurso?.id]);
  
  // Debug logs
  useEffect(() => {
    console.log('ResultadosPage - Concurso:', concurso);
    console.log('ResultadosPage - Rankings:', rankings);
    console.log('ResultadosPage - Participant Count:', participantCount);
  }, [concurso, rankings, participantCount]);
  
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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Trophy className="mr-2 h-7 w-7 text-yellow-500" />
          {concurso?.titulo ? `${concurso.titulo} - Resultados` : 'Rankings'}
        </h1>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          
          {concurso && !userRanking && user && (
            <Button 
              onClick={() => navigate(`/concurso/${concurso.id}/participar`)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Participar
            </Button>
          )}
          
          {concurso && !user && (
            <Button 
              onClick={() => navigate(`/auth`)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Fazer Login
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <RankingCard 
          participantCount={participantCount} 
          userRanking={userRanking} 
        />
        
        {concurso && <ConcursoInfoCard concurso={concurso} />}
      </div>
      
      <RankingTable 
        rankings={rankings} 
        currentUserId={user?.id} 
      />
      
      {!user && rankings && rankings.length > 0 && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-center text-gray-600">
            Para participar deste ranking e comparar seu desempenho, faça login ou crie uma conta.
          </p>
        </div>
      )}
    </div>
  );
};

export default ResultadosPage;
