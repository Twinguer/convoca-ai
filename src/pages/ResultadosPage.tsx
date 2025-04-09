
import React from 'react';
import { RankingCard } from '@/components/resultados/RankingCard';
import { ConcursoInfoCard } from '@/components/resultados/ConcursoInfoCard';
import { RankingTable } from '@/components/resultados/RankingTable';
import { LoadingState } from '@/components/resultados/LoadingState';
import { useResultadosData } from '@/hooks/useResultadosData';

const ResultadosPage = () => {
  const { concurso, rankings, participantCount, userRanking, isLoading, user } = useResultadosData();
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{concurso?.titulo} - Resultados</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <RankingCard 
          participantCount={participantCount} 
          userRanking={userRanking} 
        />
        
        <ConcursoInfoCard concurso={concurso} />
      </div>
      
      <RankingTable 
        rankings={rankings} 
        currentUserId={user?.id} 
      />
    </div>
  );
};

export default ResultadosPage;
