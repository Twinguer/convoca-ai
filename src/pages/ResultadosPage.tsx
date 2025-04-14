
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RankingCard } from '@/components/resultados/RankingCard';
import { ConcursoInfoCard } from '@/components/resultados/ConcursoInfoCard';
import { RankingTable } from '@/components/resultados/RankingTable';
import { LoadingState } from '@/components/resultados/LoadingState';
import { useResultadosData } from '@/hooks/useResultadosData';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/resultados/PageHeader';
import { AuthRequiredMessage } from '@/components/resultados/AuthRequiredMessage';
import { ParticipationForm } from '@/components/resultados/ParticipationForm';

const ResultadosPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showAnswerSheet = searchParams.get('showAnswerSheet') === 'true';
  
  const { 
    concurso, 
    rankings, 
    participantCount, 
    userRanking,
    isLoading,
    refreshData
  } = useResultadosData();
  
  const { user } = useAuth();
  const { toast } = useToast();
  const isAuthenticated = !!user;

  const handleParticipate = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para participar do ranking.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (concurso) {
      try {
        const { data, error } = await supabase
          .from('user_rankings')
          .insert({
            user_id: user.id,
            concurso_id: concurso.id,
            score: 0,
            edit_count: 0,
          })
          .select('id')
          .single();

        if (error) throw error;

        // Direciona o usuário para a página de resultados com o cartão de respostas aberto
        navigate(`/concurso/${concurso.id}/resultados?showAnswerSheet=true`);
        refreshData(); // Atualiza os dados do ranking
        
        toast({
          title: "Inscrição realizada!",
          description: "Preencha o cartão de respostas para participar do ranking.",
          duration: 3000
        });
      } catch (error) {
        console.error('Erro ao participar:', error);
        toast({
          title: "Erro ao participar",
          description: "Não foi possível se inscrever no ranking.",
          variant: "destructive"
        });
      }
    }
  };

  const handleRefresh = () => {
    refreshData();
    toast({
      title: "Atualizando ranking",
      description: "Os dados estão sendo atualizados...",
      duration: 2000
    });
  };

  if (isLoading) {
    return <LoadingState />;
  }

  // Se temos um userRanking e showAnswerSheet é true, mostramos o formulário de participação
  if (userRanking && showAnswerSheet && concurso) {
    return (
      <div className="container mx-auto p-2 sm:p-4">
        <ParticipationForm 
          concurso={concurso}
          isAlreadyParticipating={true}
          userRankingId={userRanking.id}
          editCount={userRanking.editCount || 0}
          showAnswerSheet={true}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-4">
      <PageHeader 
        concurso={concurso}
        userRanking={userRanking}
        isAuthenticated={isAuthenticated}
        user={user}
        onRefresh={handleRefresh}
        onParticipate={handleParticipate}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-1 sm:mb-2">
        <RankingCard participantCount={participantCount} userRanking={userRanking} />
        {concurso && <ConcursoInfoCard concurso={concurso} />}
      </div>
      
      <RankingTable 
        rankings={rankings} 
        currentUserId={user?.id} 
        isAuthenticated={isAuthenticated} 
      />
      
      {!isAuthenticated && <AuthRequiredMessage />}
    </div>
  );
};

export default ResultadosPage;
