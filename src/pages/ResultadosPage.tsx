
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RankingCard } from '@/components/resultados/RankingCard';
import { ConcursoInfoCard } from '@/components/resultados/ConcursoInfoCard';
import { RankingTable } from '@/components/resultados/RankingTable';
import { LoadingState } from '@/components/resultados/LoadingState';
import { useResultadosData } from '@/hooks/useResultadosData';
import { Button } from '@/components/ui/button';
import { Trophy, UserPlus } from 'lucide-react';

const ResultadosPage = () => {
  const navigate = useNavigate();
  const { concurso, rankings, participantCount, userRanking, isLoading, user } = useResultadosData();
  
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
        
        {concurso && !userRanking && user && (
          <Button 
            onClick={() => navigate(`/concurso/${concurso.id}/participar`)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Participar
          </Button>
        )}
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
    </div>
  );
};

export default ResultadosPage;
