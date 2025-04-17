
import React from 'react';
import { Trophy, Plus } from 'lucide-react';
import { RankingList } from '@/components/rankings/RankingList';
import { useRankingsData } from '@/hooks/useRankingsData';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const PreClassificacao = () => {
  const { rankings, isLoading } = useRankingsData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreateRanking = () => {
    if (!user) {
      toast.error("Você precisa estar logado para criar um ranking");
      navigate("/auth");
      return;
    }
    
    navigate("/criar-ranking");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Trophy className="mr-2 h-6 w-6 text-yellow-500" />
          Rankings
        </h1>
        
        <Button 
          className="flex items-center gap-2" 
          onClick={handleCreateRanking}
        >
          <Plus className="h-4 w-4" />
          Criar Ranking
        </Button>
      </div>
      
      <RankingList rankings={rankings} isLoading={isLoading} />
    </div>
  );
};

export default PreClassificacao;
