
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursoById } from '@/services/concursoService';
import { LoadingState } from '@/components/resultados/LoadingState';
import { ParticipationForm } from '@/components/resultados/ParticipationForm';
import { useAuth } from '@/hooks/useAuth';
import { useSecureUrls } from '@/services/urlObfuscation';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface ConcursoParticipationProps {
  concursoId?: string;
  secureToken?: string;
}

const ConcursoParticipation: React.FC<ConcursoParticipationProps> = ({ concursoId, secureToken }) => {
  const { id: urlId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { generateSecureUrl } = useSecureUrls();
  
  // Usar concursoId passado como prop ou do URL
  const id = concursoId || urlId;

  // Log removido por segurança

  // Fetch concurso details with better error handling
  const {
    data: concurso,
    isLoading: isLoadingConcurso,
    error: concursoError
  } = useQuery({
    queryKey: ['concurso', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('ID do concurso não fornecido');
      }
      
      // Logs removidos por segurança
      const result = await fetchConcursoById(id);
      return result;
    },
    enabled: !!id,
    retry: 1
  });

  // Check if user is already participating and get ranking ID
  const {
    data: userRanking,
    isLoading: isCheckingParticipation
  } = useQuery({
    queryKey: ['participating', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return null;
      
      // Log removido por segurança
      
      const { data, error } = await supabase
        .from('user_rankings')
        .select('id, reservation_type')
        .eq('concurso_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('[ConcursoParticipation] Error checking participation:', error);
        throw error;
      }
      
      // Log removido por segurança
      return data;
    },
    enabled: !!user && !!id
  });

  if (isLoadingConcurso || isCheckingParticipation) {
    return <LoadingState />;
  }

  // Handle errors
  if (concursoError) {
    console.error('[ConcursoParticipation] Error loading concurso:', concursoError);
    
    return (
      <Card className="mx-auto max-w-4xl mt-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <h1 className="text-2xl font-bold text-destructive">Erro ao carregar concurso</h1>
          </div>
          <div className="space-y-2">
            <p className="text-foreground">
              Não foi possível encontrar o concurso solicitado.
            </p>
            <p className="text-sm text-muted-foreground">
              ID: {id}
            </p>
            <p className="text-sm text-muted-foreground">
              Erro: {concursoError.message}
            </p>
          </div>
          <button 
            onClick={() => navigate('/concursos')}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Voltar para Concursos
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!id) {
    return (
      <Card className="mx-auto max-w-4xl mt-6">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-4 text-foreground">ID do concurso não fornecido</h1>
          <p className="text-muted-foreground">Por favor, acesse um concurso válido.</p>
        </CardContent>
      </Card>
    );
  }

  if (!concurso) {
    return (
      <Card className="mx-auto max-w-4xl mt-6">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-4 text-foreground">Concurso não encontrado</h1>
          <p className="text-muted-foreground">O concurso que você está tentando acessar não existe ou foi removido.</p>
          <p className="text-sm text-muted-foreground mt-2">ID: {id}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-4">
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
