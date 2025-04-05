
import React, { useState } from 'react';
import { Search } from 'lucide-react';

const PreClassificacao: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConcurso, setSelectedConcurso] = useState('');
  
  // Exemplo de dados
  const concursos = [
    { id: "1", nome: "Analista Administrativo - Ministério da Economia" },
    { id: "2", nome: "Técnico em Informática - INSS" },
    { id: "3", nome: "Auditor Fiscal - Receita Federal" },
    { id: "4", nome: "Técnico Judiciário - Tribunal Regional Federal" }
  ];
  
  const candidatos = [
    { id: "1", nome: "Ana Silva", inscricao: "123456", nota: 85.75, posicao: 12, concursoId: "1" },
    { id: "2", nome: "João Pereira", inscricao: "789012", nota: 92.50, posicao: 3, concursoId: "1" },
    { id: "3", nome: "Mariana Costa", inscricao: "345678", nota: 88.25, posicao: 7, concursoId: "1" },
    { id: "4", nome: "Lucas Santos", inscricao: "901234", nota: 79.00, posicao: 25, concursoId: "2" },
    { id: "5", nome: "Camila Oliveira", inscricao: "567890", nota: 95.50, posicao: 1, concursoId: "2" },
    { id: "6", nome: "Rafael Souza", inscricao: "234567", nota: 83.75, posicao: 15, concursoId: "3" }
  ];
  
  const filteredCandidatos = selectedConcurso
    ? candidatos.filter(c => c.concursoId === selectedConcurso && 
        (c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
         c.inscricao.includes(searchTerm)))
    : [];
  
  return (
    <div className="page-container">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Pré-Classificação</h1>
      
      <div className="mb-8">
        <p className="text-gray-600 mb-4">
          A pré-classificação mostra uma estimativa da sua posição no concurso com base nas notas divulgadas. 
          Selecione um concurso e busque por seu nome ou número de inscrição.
        </p>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm text-yellow-700">
          Atenção: Esta é uma classificação não oficial, baseada em dados preliminares. 
          A classificação oficial será divulgada pelo órgão responsável pelo concurso.
        </div>
      </div>
      
      <div className="mb-8">
        <label htmlFor="concurso" className="block text-sm font-medium text-gray-700 mb-1">
          Selecione o Concurso
        </label>
        <select
          id="concurso"
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-convoca-500 focus:ring-convoca-500"
          value={selectedConcurso}
          onChange={(e) => setSelectedConcurso(e.target.value)}
        >
          <option value="">-- Selecione um concurso --</option>
          {concursos.map((concurso) => (
            <option key={concurso.id} value={concurso.id}>
              {concurso.nome}
            </option>
          ))}
        </select>
      </div>
      
      {selectedConcurso && (
        <>
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-convoca-500 focus:border-convoca-500"
                placeholder="Busque por nome ou inscrição"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posição
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inscrição
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nota
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCandidatos.length > 0 ? (
                  filteredCandidatos.map((candidato) => (
                    <tr key={candidato.id}>
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
                      {searchTerm ? "Nenhum candidato encontrado com esses critérios." : "Digite um nome ou número de inscrição para buscar."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default PreClassificacao;
