import React from 'react';
import { RankingList } from '@/components/rankings/RankingList';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useRankingsData } from '@/hooks/useRankingsData';
import { toast } from 'sonner';

const PreClassificacao = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { rankings, isLoading } = useRankingsData();

  React.useEffect(() => {
    if (!user) {
      toast.error('Você precisa estar logado para ver os rankings');
      navigate('/auth');
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-lg">Carregando rankings...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Rankings Disponíveis</h1>
      <RankingList rankings={rankings} isLoading={isLoading} />
    </div>
  );
};

export default PreClassificacao;