
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursoById } from '@/services/concursoService';
import { LoadingState } from '@/components/resultados/LoadingState';
import { ParticipationForm } from '@/components/resultados/ParticipationForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';

const ConcursoParticipation = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  // Fetch concurso details
  const { data: concurso, isLoading: isLoadingConcurso } = useQuery({
    queryKey: ['concurso', id],
    queryFn: () => fetchConcursoById(id!)
  });

  // Check if user is already participating and get ranking ID
  const { data: userRanking, isLoading: isCheckingParticipation } = useQuery({
    queryKey: ['participating', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return null;
      const { data, error } = await supabase
        .from('user_rankings')
        .select('id')
        .eq('concurso_id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found, user is not participating
          return null;
        }
        throw error;
      }
      return data;
    },
    enabled: !!user && !!id
  });

  if (isLoadingConcurso || isCheckingParticipation) {
    return <LoadingState />;
  }

  if (!concurso) {
    return (
      <Card className="mx-auto max-w-4xl mt-6">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-4">Concurso não encontrado</h1>
          <p>O concurso que você está tentando acessar não existe ou foi removido.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{concurso.titulo}</h1>
      <p className="text-lg mb-2">Órgão: <span className="font-medium">{concurso.orgao}</span></p>
      <p className="text-lg mb-6">Banca: <span className="font-medium">{concurso.banca}</span></p>
      
      <div className="mt-8">
        <ParticipationForm
          concurso={concurso}
          isAlreadyParticipating={!!userRanking}
          userRankingId={userRanking?.id}
        />
      </div>
    </div>
  );
};

export default ConcursoParticipation;
