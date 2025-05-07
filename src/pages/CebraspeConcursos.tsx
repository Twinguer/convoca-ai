import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Building, Calendar, User, ChevronRight } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { fetchConcursos } from '../services/concursoService';
import { Concurso } from '../types/concursos';

const CebraspeConcursos: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState<'cards' | 'table'>('cards');
  
  // Fetch concursos em andamento - Updated to pass filter object correctly
  const { data: concursosAtivos, isLoading, isError, refetch } = useQuery({
    queryKey: ['concursos', { banca: 'Cebraspe', status: 'Em andamento' }],
    queryFn: () => fetchConcursos({ banca: 'Cebraspe', status: 'Em andamento' }),
    staleTime: 4 * 60 * 60 * 1000, // 4 horas
  });

  // Filter concursos baseado no termo de busca
  const filteredConcursos = concursosAtivos?.filter(concurso => 
    concurso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    concurso.orgao.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Get all concursos (não limitando aos 20 maiores)
  const sortedConcursos = [...filteredConcursos]
    .sort((a, b) => (b.vagas || 0) - (a.vagas || 0));

  // Get unique values for filter dropdowns
  const uniqueOrgaos = [...new Set(concursosAtivos?.map(c => c.orgao) || [])];

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Concursos Cebraspe</h1>
        <p className="text-gray-600">
          Todos os concursos em andamento organizados pela Cebraspe
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar concurso ou órgão..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label htmlFor="orgao" className="text-sm font-medium">Órgão</label>
                <Select 
                  value={searchTerm || 'Todos'} 
                  onValueChange={(value) => setSearchTerm(value === 'Todos' ? '' : value)}
                >
                  <SelectTrigger id="orgao">
                    <SelectValue placeholder="Órgão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    {uniqueOrgaos.map((orgao) => (
                      <SelectItem key={orgao} value={orgao}>{orgao}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-6" 
                onClick={clearFilters}
              >
                Limpar Filtros
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        
        {/* View switcher */}
        <div className="flex rounded-md overflow-hidden">
          <button 
            onClick={() => setViewType('cards')}
            className={`px-3 py-2 ${viewType === 'cards' 
              ? 'bg-convoca-600 text-white' 
              : 'bg-gray-100 text-gray-600'}`}
          >
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 gap-1 h-4 w-4">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
              <span className="hidden md:inline">Cards</span>
            </div>
          </button>
          <button 
            onClick={() => setViewType('table')}
            className={`px-3 py-2 ${viewType === 'table' 
              ? 'bg-convoca-600 text-white' 
              : 'bg-gray-100 text-gray-600'}`}
          >
            <div className="flex items-center gap-2">
              <div className="flex flex-col justify-between h-4 w-4">
                <div className="h-0.5 bg-current rounded-full"></div>
                <div className="h-0.5 bg-current rounded-full"></div>
                <div className="h-0.5 bg-current rounded-full"></div>
              </div>
              <span className="hidden md:inline">Tabela</span>
            </div>
          </button>
        </div>
      </div>

      {/* Resultados */}
      {renderContent()}
    </div>
  );

  function renderContent() {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-gray-100 rounded-lg shadow p-6 h-48"></div>
          ))}
        </div>
      );
    }
    
    if (isError) {
      return (
        <div className="text-center py-10">
          <p className="text-red-500">Erro ao carregar concursos. Tente novamente mais tarde.</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      );
    }
    
    if (sortedConcursos.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-500">Nenhum concurso encontrado com os filtros selecionados.</p>
          <Button variant="outline" className="mt-4" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>
      );
    }
    
    if (viewType === 'cards') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedConcursos.map((concurso) => (
            <div key={concurso.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{concurso.titulo}</h3>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    {concurso.status}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Building className="h-4 w-4 mr-2" />
                    <span className="text-sm">{concurso.orgao}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm">{new Date(concurso.data_publicacao).toLocaleDateString('pt-BR')}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-sm">{concurso.vagas || 'Não informado'} vagas</span>
                  </div>
                </div>
                
                <Link 
                  to={`/concurso/${concurso.id}/resultados`}
                  className="flex items-center text-convoca-600 hover:text-convoca-700 text-sm font-medium"
                >
                  Resultados
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Concurso</TableHead>
                <TableHead>Órgão</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Vagas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedConcursos.map((concurso) => (
                <TableRow key={concurso.id}>
                  <TableCell className="font-medium">{concurso.titulo}</TableCell>
                  <TableCell>{concurso.orgao}</TableCell>
                  <TableCell>{new Date(concurso.data_publicacao).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{concurso.vagas || 'Não informado'}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      {concurso.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to={`/concurso/${concurso.id}/resultados`}
                      className="inline-flex items-center text-convoca-600 hover:text-convoca-700 text-sm font-medium"
                    >
                      Resultados
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }
  }
};

export default CebraspeConcursos;
