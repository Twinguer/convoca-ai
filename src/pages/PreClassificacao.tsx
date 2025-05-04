
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
    <div className="container mx-auto p-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center text-slate-800">
            <Trophy className="mr-3 h-7 w-7 text-yellow-500" />
            Rankings
          </h1>
          <p className="text-slate-500 ml-10 mt-1">
            Acompanhe e compare seu desempenho em concursos
          </p>
        </div>
        
        <Button 
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700" 
          onClick={handleCreateRanking}
          size="lg"
        >
          <Plus className="h-5 w-5" />
          Criar Ranking
        </Button>
      </div>
      
      <div className="bg-gray-50/70 p-6 rounded-xl">
        <RankingList rankings={rankings} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default PreClassificacao;
