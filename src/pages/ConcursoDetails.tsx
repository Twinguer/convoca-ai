
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Building, Users, Award, FileText, ExternalLink, BarChart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbList } from '../components/ui/breadcrumb';
import { fetchConcursoById } from '../services/concursoService';

const ConcursoDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: concurso, isLoading, isError } = useQuery({
    queryKey: ['concurso', id],
    queryFn: () => fetchConcursoById(id || ''),
    enabled: !!id
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="h-40 bg-gray-200 rounded mb-6"></div>
        <div className="h-20 bg-gray-200 rounded mb-6"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (isError || !concurso) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Concurso não encontrado</h2>
        <p className="text-gray-600 mb-6">O concurso que você está procurando não existe ou foi removido.</p>
        <Button onClick={() => navigate('/')}>Voltar para Editais</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Editais</BreadcrumbLink>
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
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>
      
      <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{concurso.titulo}</h1>
          <p className="text-gray-600 flex items-center mt-1">
            <Building className="mr-1 h-4 w-4" />
            {concurso.orgao}
          </p>
        </div>
        <Badge className={`${
          concurso.status === 'Em andamento' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {concurso.status}
        </Badge>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Informações do Concurso</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Data de Publicação</p>
              <p className="font-medium">{formatDate(concurso.data_publicacao)}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Vagas</p>
              <p className="font-medium">{concurso.vagas}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Banca</p>
              <p className="font-medium">{concurso.banca}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Inscritos</p>
              <p className="font-medium">{concurso.inscritos?.toLocaleString('pt-BR') || 'Não informado'}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Status do Concurso</h2>
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
          <div>
            <p className="text-sm text-gray-500">Etapa Atual</p>
            <p className="font-medium">{concurso.etapa_atual}</p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button asChild className="gap-2">
          <a href={concurso.link} target="_blank" rel="noopener noreferrer">
            Acessar Edital
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        
        <Button asChild variant="secondary" className="gap-2">
          <Link to={`/concurso/${id}/resultados`}>
            Resultados
            <BarChart className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ConcursoDetails;
