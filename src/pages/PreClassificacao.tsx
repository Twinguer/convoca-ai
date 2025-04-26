
import React from 'react';
import { Trophy } from 'lucide-react';
import { RankingList } from '@/components/rankings/RankingList';
import { useRankingsData } from '@/hooks/useRankingsData';

const PreClassificacao = () => {
  const {
    rankings,
    isLoading
  } = useRankingsData();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Trophy className="mr-2 h-7 w-7 text-yellow-500" />
        Rankings
      </h1>
      
      <RankingList rankings={rankings} isLoading={isLoading} />
    </div>
  );
};

export default PreClassificacao;
