
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Pencil, RefreshCw, Trophy } from 'lucide-react';
import { RankingTable } from '@/components/resultados/RankingTable';
import { RankingCard } from '@/components/resultados/RankingCard';
import { ConcursoHeader } from '@/components/resultados/ConcursoHeader';
import { useAuth } from '@/hooks/useAuth';
import { useResultadosData } from '@/hooks/useResultadosData';
import { LoadingState } from '@/components/resultados/LoadingState';

const ResultadosPage: React.FC = () => {
  const { 
    concurso, 
    rankings, 
    participantCount, 
    userRanking, 
    isLoading,
    user,
    refreshData
  } = useResultadosData();
  
  const { isAuthenticated } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (!concurso) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h1 className="text-2xl font-bold mb-4">Ranking não encontrado</h1>
          <p>O ranking que você está tentando acessar não existe ou foi removido.</p>
          <Button asChild className="mt-4">
            <Link to="/rankings">Voltar para os Rankings</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <ConcursoHeader concurso={concurso} userScore={userRanking?.score} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-3 flex items-center justify-end gap-2">
          <Button 
            variant="ghost"
            size="sm"
            className="text-gray-600 gap-1"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar ranking'}
          </Button>
        </div>
        
        <div className="lg:col-span-2">
          <RankingTable 
            rankings={rankings} 
            currentUserId={user?.id}
            isAuthenticated={isAuthenticated}
            concurso={concurso}
          />
        </div>
        
        <div className="lg:col-span-1">
          <div className="space-y-6">
            <RankingCard 
              participantCount={participantCount}
              userRanking={userRanking ? {
                position: userRanking.position,
                score: userRanking.score
              } : null}
            />
            
            {isAuthenticated && (
              <Button 
                asChild 
                className="w-full"
              >
                <Link to={`/rankings/participar/${concurso.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {userRanking ? 'Editar meu cartão' : 'Participar do ranking'}
                </Link>
              </Button>
            )}
            
            {!isAuthenticated && (
              <Button asChild className="w-full">
                <Link to="/auth" className="flex items-center justify-center">
                  <Trophy className="mr-2 h-4 w-4" />
                  Cadastre-se para participar
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultadosPage;
