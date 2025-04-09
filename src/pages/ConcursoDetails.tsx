
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Building, User, FileText, ChevronRight, Award, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbList } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { fetchConcursoById } from '@/services/concursoService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const ConcursoDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch concurso data
  const { data: concurso, isLoading, isError } = useQuery({
    queryKey: ['concurso', id],
    queryFn: () => fetchConcursoById(id || ''),
    enabled: !!id
  });
  
  // Fetch participant count
  const { data: participantCount = 0 } = useQuery({
    queryKey: ['participant-count', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('count_concurso_participants', { concurso_id: id });
        
      if (error) throw error;
      return data as number;
    },
    enabled: !!id
  });
  
  // Check if user is already participating
  const { data: isParticipating = false } = useQuery({
    queryKey: ['is-participating', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return false;
      
      const { data, error } = await supabase
        .from('user_rankings')
        .select('id')
        .eq('user_id', user.id)
        .eq('concurso_id', id)
        .maybeSingle();
        
      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!id
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="h-40 bg-gray-200 rounded mb-6"></div>
      </div>
    );
  }

  if (isError || !concurso) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Concurso não encontrado</h2>
        <p className="text-gray-600 mb-6">O concurso que você está procurando não existe ou foi removido.</p>
        <Button onClick={() => navigate('/concursos')}>Voltar para Concursos</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/concursos">Concursos</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{concurso.titulo}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 flex items-center gap-1"
        onClick={() => navigate('/concursos')}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>
      
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{concurso.titulo}</h1>
            <p className="text-gray-600">{concurso.orgao}</p>
          </div>
          <Badge className={`${
            concurso.status === "Em andamento" 
              ? "bg-green-100 text-green-800 hover:bg-green-100" 
              : "bg-blue-100 text-blue-800 hover:bg-blue-100"
          }`}>
            {concurso.status}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Calendar className="h-8 w-8 text-gray-500 mb-2" />
              <h3 className="font-medium text-gray-900">Data de Publicação</h3>
              <p className="text-gray-600">
                {new Date(concurso.data_publicacao).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <User className="h-8 w-8 text-gray-500 mb-2" />
              <h3 className="font-medium text-gray-900">Vagas</h3>
              <p className="text-gray-600">{concurso.vagas}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Users className="h-8 w-8 text-gray-500 mb-2" />
              <h3 className="font-medium text-gray-900">Participantes no Ranking</h3>
              <p className="text-gray-600">{participantCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Detalhes do Concurso</CardTitle>
          <CardDescription>
            Informações detalhadas sobre o concurso {concurso.titulo}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info">
            <TabsList className="w-full max-w-md grid grid-cols-3 mb-6">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="etapas">Etapas</TabsTrigger>
              <TabsTrigger value="edital">Edital</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Órgão</h3>
                  <p className="text-gray-600 flex items-center">
                    <Building className="h-4 w-4 text-gray-400 mr-2" />
                    {concurso.orgao}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Banca Organizadora</h3>
                  <p className="text-gray-600">{concurso.banca}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Vagas</h3>
                  <p className="text-gray-600">{concurso.vagas} vagas</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Inscritos</h3>
                  <p className="text-gray-600">{concurso.inscritos || "Não informado"}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Status</h3>
                  <p className="text-gray-600">{concurso.status}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Etapa Atual</h3>
                  <p className="text-gray-600">{concurso.etapa_atual || "Não informado"}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Tipo de Prova</h3>
                  <p className="text-gray-600">{concurso.exam_type || "Alternativas"}</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="etapas">
              <div className="space-y-6">
                <div className="border-l-2 border-gray-200 pl-4 py-2">
                  <h3 className="font-medium text-gray-900 mb-1">Publicação do Edital</h3>
                  <p className="text-gray-600 text-sm">
                    {new Date(concurso.data_publicacao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                <div className="border-l-2 border-gray-200 pl-4 py-2">
                  <h3 className="font-medium text-gray-900 mb-1">Aplicação das Provas</h3>
                  <p className="text-gray-600 text-sm">Conforme cronograma no edital</p>
                </div>
                
                <div className="border-l-2 border-gray-200 pl-4 py-2">
                  <h3 className="font-medium text-gray-900 mb-1">Divulgação do Resultado</h3>
                  <p className="text-gray-600 text-sm">Aguardando</p>
                </div>
                
                <div className="border-l-2 border-gray-200 pl-4 py-2">
                  <h3 className="font-medium text-gray-900 mb-1">Homologação</h3>
                  <p className="text-gray-600 text-sm">Aguardando</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="edital">
              <div className="flex flex-col items-center justify-center py-8">
                <FileText className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Edital do Concurso</h3>
                <p className="text-gray-600 text-center mb-6 max-w-md">
                  Acesse o site oficial da banca organizadora para consultar o edital completo do concurso.
                </p>
                <Button asChild variant="outline">
                  <a href={concurso.link} target="_blank" rel="noopener noreferrer">
                    Acessar Site da Banca
                  </a>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Ranking não oficial</CardTitle>
            <CardDescription>
              Veja como estão os candidatos no ranking não oficial deste concurso
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <Award className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-center mb-6">
              {participantCount > 0 ? (
                <>
                  Este concurso possui <strong>{participantCount}</strong> participantes no ranking não oficial.
                </>
              ) : (
                "Seja o primeiro a participar do ranking não oficial deste concurso!"
              )}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            {isParticipating ? (
              <Button asChild>
                <Link to={`/concurso/${id}/resultados`} className="flex items-center gap-1">
                  Ver Ranking
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to={`/concurso/${id}/participar`} className="flex items-center gap-1">
                  Participar do Ranking
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Resultados oficiais</CardTitle>
            <CardDescription>
              Acesse os resultados oficiais divulgados pela banca organizadora
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-center mb-6">
              Consulte os resultados oficiais e documentos divulgados pela banca organizadora.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild variant="outline">
              <Link to={`/concurso/${id}/resultados`} className="flex items-center gap-1">
                Ver Resultados
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ConcursoDetails;
