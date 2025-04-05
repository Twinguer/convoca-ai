
import React, { useState } from 'react';
import { Search, Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PreClassificacao: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConcurso, setSelectedConcurso] = useState('all');
  const [selectedCargo, setSelectedCargo] = useState('all');
  const [selectedLocalidade, setSelectedLocalidade] = useState('all');
  const [orderBy, setOrderBy] = useState('posicao');
  const [orderDirection, setOrderDirection] = useState('asc');
  
  // Exemplo de dados
  const concursos = [
    { id: "1", nome: "Analista Administrativo - Ministério da Economia" },
    { id: "2", nome: "Técnico em Informática - INSS" },
    { id: "3", nome: "Auditor Fiscal - Receita Federal" },
    { id: "4", nome: "Técnico Judiciário - Tribunal Regional Federal" }
  ];

  const cargos = [
    { id: "1", nome: "Analista Administrativo", concursoId: "1" },
    { id: "2", nome: "Técnico em Informática", concursoId: "2" },
    { id: "3", nome: "Auditor Fiscal", concursoId: "3" },
    { id: "4", nome: "Técnico Judiciário", concursoId: "4" }
  ];

  const localidades = [
    { id: "1", nome: "Brasília", concursoId: "1" },
    { id: "2", nome: "Rio de Janeiro", concursoId: "1" },
    { id: "3", nome: "São Paulo", concursoId: "2" },
    { id: "4", nome: "Belo Horizonte", concursoId: "3" },
    { id: "5", nome: "Salvador", concursoId: "4" }
  ];
  
  const candidatos = [
    { id: "1", nome: "Ana Silva", inscricao: "123456", nota: 85.75, posicao: 12, concursoId: "1", cargoId: "1", localidadeId: "1" },
    { id: "2", nome: "João Pereira", inscricao: "789012", nota: 92.50, posicao: 3, concursoId: "1", cargoId: "1", localidadeId: "2" },
    { id: "3", nome: "Mariana Costa", inscricao: "345678", nota: 88.25, posicao: 7, concursoId: "1", cargoId: "1", localidadeId: "1" },
    { id: "4", nome: "Lucas Santos", inscricao: "901234", nota: 79.00, posicao: 25, concursoId: "2", cargoId: "2", localidadeId: "3" },
    { id: "5", nome: "Camila Oliveira", inscricao: "567890", nota: 95.50, posicao: 1, concursoId: "2", cargoId: "2", localidadeId: "3" },
    { id: "6", nome: "Rafael Souza", inscricao: "234567", nota: 83.75, posicao: 15, concursoId: "3", cargoId: "3", localidadeId: "4" }
  ];

  const filteredCargos = selectedConcurso !== 'all'
    ? cargos.filter(c => c.concursoId === selectedConcurso)
    : [];

  const filteredLocalidades = selectedConcurso !== 'all'
    ? localidades.filter(l => l.concursoId === selectedConcurso)
    : [];
  
  const filteredCandidatos = candidatos.filter(c => {
    if (selectedConcurso !== 'all' && c.concursoId !== selectedConcurso) return false;
    if (selectedCargo !== 'all' && c.cargoId !== selectedCargo) return false;
    if (selectedLocalidade !== 'all' && c.localidadeId !== selectedLocalidade) return false;
    if (searchTerm && !c.nome.toLowerCase().includes(searchTerm.toLowerCase()) && !c.inscricao.includes(searchTerm)) return false;
    return true;
  });

  // Ordenação
  const sortedCandidatos = [...filteredCandidatos].sort((a, b) => {
    const factor = orderDirection === 'asc' ? 1 : -1;
    if (orderBy === 'posicao') return (a.posicao - b.posicao) * factor;
    if (orderBy === 'nota') return (a.nota - b.nota) * -factor; // Invertido para notas (maior primeiro)
    if (orderBy === 'nome') return a.nome.localeCompare(b.nome) * factor;
    return 0;
  });

  const toggleSort = (field: string) => {
    if (orderBy === field) {
      setOrderDirection(orderDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(field);
      setOrderDirection('asc');
    }
  };

  return (
    <div className="page-container">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Pré-Classificação</h1>
      
      <div className="mb-8">
        <p className="text-gray-600 mb-4">
          A pré-classificação mostra uma estimativa da sua posição no concurso com base nas notas divulgadas. 
          Filtre por concurso, cargo e localidade para encontrar sua classificação.
        </p>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm text-yellow-700">
          Atenção: Esta é uma classificação não oficial, baseada em dados preliminares. 
          A classificação oficial será divulgada pelo órgão responsável pelo concurso.
        </div>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="concurso" className="block text-sm font-medium text-gray-700 mb-1">
                Concurso
              </label>
              <Select
                value={selectedConcurso}
                onValueChange={(value) => {
                  setSelectedConcurso(value);
                  setSelectedCargo('all');
                  setSelectedLocalidade('all');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o concurso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os concursos</SelectItem>
                  {concursos.map((concurso) => (
                    <SelectItem key={concurso.id} value={concurso.id}>
                      {concurso.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 mb-1">
                Cargo
              </label>
              <Select
                value={selectedCargo}
                onValueChange={setSelectedCargo}
                disabled={selectedConcurso === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cargos</SelectItem>
                  {filteredCargos.map((cargo) => (
                    <SelectItem key={cargo.id} value={cargo.id}>
                      {cargo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="localidade" className="block text-sm font-medium text-gray-700 mb-1">
                Localidade
              </label>
              <Select
                value={selectedLocalidade}
                onValueChange={setSelectedLocalidade}
                disabled={selectedConcurso === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a localidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as localidades</SelectItem>
                  {filteredLocalidades.map((localidade) => (
                    <SelectItem key={localidade.id} value={localidade.id}>
                      {localidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Buscar por nome ou inscrição
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-convoca-500 focus:border-convoca-500"
                  placeholder="Busque por nome ou inscrição"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
          
      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('posicao')}
                >
                  <div className="flex items-center">
                    <span>Posição</span>
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('nome')}
                >
                  <div className="flex items-center">
                    <span>Nome</span>
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span>Inscrição</span>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('nota')}
                >
                  <div className="flex items-center">
                    <span>Nota</span>
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCandidatos.length > 0 ? (
                sortedCandidatos.map((candidato) => (
                  <tr key={candidato.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {candidato.posicao}º
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidato.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidato.inscricao}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {candidato.nota.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    {filteredCandidatos.length === 0 && searchTerm ? 
                      "Nenhum candidato encontrado com esses critérios." : 
                      "Selecione os filtros ou pesquise para visualizar os candidatos."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PreClassificacao;
