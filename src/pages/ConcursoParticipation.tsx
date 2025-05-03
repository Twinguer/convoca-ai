
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursoById } from '@/services/concursoService';
import { LoadingState } from '@/components/resultados/LoadingState';
import { ParticipationForm } from '@/components/resultados/ParticipationForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const ConcursoParticipation = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

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
        .select('id, reservation_type')
        .eq('concurso_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{concurso.titulo}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Órgão</p>
              <p>{concurso.orgao}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Banca</p>
              <p>{concurso.banca}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-4">
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
