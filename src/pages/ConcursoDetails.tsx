
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursoById } from '@/services/concursoService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/resultados/LoadingState';
import { Trophy, ArrowRight, AlertCircle, UserPlus, Users } from 'lucide-react';
import { RankingItem } from '@/components/rankings/RankingList';
import { supabase } from '@/integrations/supabase/client';

const ConcursoDetails = () => {
  const { id } = useParams<{ id: string; }>();
  
  const { data: concurso, isLoading } = useQuery({
    queryKey: ['concurso', id],
    queryFn: () => fetchConcursoById(id!)
  });

  // Fetch ranking data (participant count, creator info)
  const { data: rankingData, isLoading: isRankingLoading } = useQuery({
    queryKey: ['ranking-details', id],
    queryFn: async () => {
      // Count participants
      const { data: countData, error: countError } = await supabase
        .rpc('count_concurso_participants', { concurso_id: id });
      
      if (countError) {
        console.error('Error fetching participant count:', countError);
        return null;
      }
      
      // Get creator info if available
      const { data: concursoData, error: concursoError } = await supabase
        .from('concursos')
        .select(`
          created_by_user_id,
          is_admin_created
        `)
        .eq('id', id)
        .single();
      
      if (concursoError) {
        console.error('Error fetching concurso creator data:', concursoError);
        return { participantCount: countData || 0 };
      }
      
      // If there's a creator and it's not admin-created, fetch their name
      let creatorName = null;
      if (concursoData.created_by_user_id && !concursoData.is_admin_created) {
        const { data: userData, error: userError } = await supabase
          .from('users_profiles')
          .select('name')
          .eq('id', concursoData.created_by_user_id)
          .single();
        
        if (!userError && userData) {
          creatorName = userData.name;
        }
      }
      
      return {
        participantCount: countData || 0,
        creatorName,
        isAdminCreated: concursoData.is_admin_created
      };
    }
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (!concurso) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Concurso não encontrado</h1>
        <p>O concurso que você está tentando acessar não existe ou foi removido.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">{concurso.titulo}</h1>
      <div className="flex items-center gap-2 mb-6">
        <Badge variant="outline">{concurso.orgao}</Badge>
        <Badge variant="outline">{concurso.banca}</Badge>
        <Badge variant={concurso.status === 'Em andamento' ? 'default' : 'secondary'}>
          {concurso.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1 mb-1">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Número de Vagas</dt>
                <dd>{concurso.vagas || 'Não informado'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Inscritos</dt>
                <dd>{concurso.inscritos?.toLocaleString() || 'Não informado'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Data da Prova</dt>
                <dd>{concurso.data_publicacao || 'Não informado'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Etapa Atual</dt>
                <dd>{concurso.etapa_atual || 'Não informado'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Provas</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Tipo de Prova</dt>
                <dd>{concurso.exam_type || 'Objetiva'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Quantidade de Alternativas</dt>
                <dd>{concurso.alternatives_count || 5}</dd>
              </div>
              {concurso.wrong_answer_penalty !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Penalidade por Erro</dt>
                  <dd>{concurso.wrong_answer_penalty}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Pesos das Provas</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              {concurso.has_basic_knowledge && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Conhecimentos Básicos</dt>
                  <dd>{concurso.basic_knowledge_weight || 1}</dd>
                </div>
              )}
              {concurso.has_specific_knowledge_1 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Conhecimentos Específicos 1</dt>
                  <dd>{concurso.specific_knowledge_1_weight || 1}</dd>
                </div>
              )}
              {concurso.has_specific_knowledge_2 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Conhecimentos Específicos 2</dt>
                  <dd>{concurso.specific_knowledge_2_weight || 1}</dd>
                </div>
              )}
              {concurso.has_specific_knowledge_3 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Conhecimentos Específicos 3</dt>
                  <dd>{concurso.specific_knowledge_3_weight || 1}</dd>
                </div>
              )}
              {concurso.has_discursive && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Discursiva</dt>
                  <dd>{concurso.discursive_weight || 1}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
              Ranking
            </CardTitle>
            <CardDescription>
              Participe do ranking e compare seu desempenho com outros candidatos
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <div className="flex space-x-4">
              <Button asChild>
                <Link to={`/concurso/${id}/participar`} className="flex items-center">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Participar
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/concurso/${id}/resultados`} className="flex items-center">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Ver Ranking
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        {/* Replacing Resources card with Ranking card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
              Informações do Ranking
            </CardTitle>
            <CardDescription>
              Estatísticas e detalhes sobre o ranking deste concurso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-gray-600" />
                <p className="text-sm">
                  Participantes: <Badge variant="outline">{isRankingLoading ? '...' : rankingData?.participantCount || 0}</Badge>
                </p>
              </div>
              
              {rankingData && (rankingData.creatorName || rankingData.isAdminCreated) && (
                <div className="flex items-center text-xs text-gray-500 mt-2">
                  <span className="text-right mx-0 text-xs truncate max-w-[200px]">
                    Criado por: {rankingData.isAdminCreated ? 'Admin' : rankingData.creatorName}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link to={`/concurso/${id}/resultados`} className="flex items-center">
                <ArrowRight className="mr-2 h-4 w-4" />
                Ver Ranking Completo
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ConcursoDetails;
