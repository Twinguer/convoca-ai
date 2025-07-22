import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUserRankings } from '@/services/rankingService';
import { RankingList } from '@/components/rankings/RankingList';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const PreClassificacao = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    data: rankings,
    isLoading,
    error
  } = useQuery({
    queryKey: ['user-rankings', user?.id],
    queryFn: () => user?.id ? fetchUserRankings(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (!user) {
      toast.error('Você precisa estar logado para ver seus rankings');
      navigate('/auth');
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-lg">Carregando seus rankings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-lg text-red-500">Erro ao carregar rankings.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus Rankings</h1>
      <RankingList rankings={rankings || []} isLoading={isLoading} />
    </div>
  );
};

export default PreClassificacao;