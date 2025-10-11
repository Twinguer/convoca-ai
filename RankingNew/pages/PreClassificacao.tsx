import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RankingList } from '@/components/rankings/RankingList';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useRankingsData } from '@/hooks/useRankingsData';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import Footer from '@/components/Footer';

const PreClassificacao = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { rankings, isLoading } = useRankingsData();

  const handleRankingClick = (e: React.MouseEvent, rankingId: string) => {
    if (!user) {
      e.preventDefault();
      navigate('/auth', { state: { from: `/concurso/${rankingId}/resultados` } });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-lg">Carregando rankings...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Rankings Disponíveis</h1>
        {user && (
          <Link to="/criar-ranking">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Criar Ranking
            </Button>
          </Link>
        )}
      </div>
      <RankingList rankings={rankings} isLoading={isLoading} onRankingClick={handleRankingClick} />
      <Footer />
    </div>
  );
};

export default PreClassificacao;