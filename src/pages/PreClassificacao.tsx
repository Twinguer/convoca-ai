
import React from 'react';
import { Trophy, PlusCircle } from 'lucide-react';
import { RankingList } from '@/components/rankings/RankingList';
import { useRankingsData } from '@/hooks/useRankingsData';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PreClassificacao = () => {
  const {
    rankings,
    isLoading
  } = useRankingsData();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleCreateRanking = () => {
    if (user) {
      navigate('/project/admin/man/concursos/novo');
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8" />
          Rankings
        </h1>
        {user && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCreateRanking}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Criar Ranking
          </Button>
        )}
      </div>
      
      <RankingList rankings={rankings} isLoading={isLoading} />
    </div>
  );
};

export default PreClassificacao;
