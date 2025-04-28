
import React, { useState } from 'react';
import { Search, Calendar, AlertCircle } from 'lucide-react';

const Nomeacoes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConcurso, setSelectedConcurso] = useState('');
  
  // Exemplo de dados
  const concursos = [
    { id: "1", nome: "Analista Administrativo - Ministério da Economia" },
    { id: "2", nome: "Técnico em Informática - INSS" },
    { id: "3", nome: "Auditor Fiscal - Receita Federal" }
  ];
  
  const nomeacoes = [
    { 
      id: "1", 
      nome: "João Pereira", 
      inscricao: "789012", 
      classificacao: 3, 
      dataPortaria: "10/05/2025", 
      dataDOU: "15/05/2025", 
      dataPrazo: "14/06/2025",
      status: "Nomeado",
      cargo: "Analista Administrativo",
      lotacao: "Brasília-DF",
      concursoId: "1"
    },
    { 
      id: "2", 
      nome: "Mariana Costa", 
      inscricao: "345678", 
      classificacao: 7, 
      dataPortaria: "10/05/2025", 
      dataDOU: "15/05/2025", 
      dataPrazo: "14/06/2025",
      status: "Nomeado",
      cargo: "Analista Administrativo",
      lotacao: "Rio de Janeiro-RJ",
      concursoId: "1"
    },
    { 
      id: "3", 
      nome: "Ana Silva", 
      inscricao: "123456", 
      classificacao: 12, 
      dataPortaria: "10/05/2025", 
      dataDOU: "15/05/2025", 
      dataPrazo: "14/06/2025",
      status: "Nomeado",
      cargo: "Analista Administrativo",
      lotacao: "São Paulo-SP",
      concursoId: "1"
    },
    { 
      id: "4", 
      nome: "Camila Oliveira", 
      inscricao: "567890", 
      classificacao: 1, 
      dataPortaria: "05/06/2025", 
      dataDOU: "10/06/2025", 
      dataPrazo: "10/07/2025",
      status: "Nomeado",
      cargo: "Técnico em Informática",
      lotacao: "Brasília-DF",
      concursoId: "2"
    },
    { 
      id: "5", 
      nome: "Lucas Santos", 
      inscricao: "901234", 
      classificacao: 25, 
      dataPortaria: null, 
      dataDOU: null, 
      dataPrazo: null,
      status: "Aguardando nomeação",
      cargo: "Técnico em Informática",
      lotacao: null,
      concursoId: "2"
    }
  ];
  
  const filteredNomeacoes = selectedConcurso
    ? nomeacoes.filter(n => 
        n.concursoId === selectedConcurso && 
        (n.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
         n.inscricao.includes(searchTerm))
      )
    : [];
    
  return (
    <div className="page-container">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nomeações</h1>
      
      <div className="mb-6">
        <p className="text-gray-600">
          Acompanhe as nomeações publicadas no Diário Oficial da União (DOU) para os concursos públicos federais.
          Selecione um concurso para ver as nomeações mais recentes.
        </p>
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
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  A posse deve ocorrer no prazo de 30 dias contados da publicação do ato de nomeação no DOU. 
                  O prazo pode ser prorrogado por mais 30 dias, a pedido do interessado.
                </p>
              </div>
            </div>
          </div>
          
          <div className="relative flex-grow mb-6">
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
          
          <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidato
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classificação
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Publicação DOU
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prazo para Posse
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNomeacoes.length > 0 ? (
                  filteredNomeacoes.map((nomeacao) => (
                    <tr key={nomeacao.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{nomeacao.nome}</div>
                        <div className="text-sm text-gray-500">Inscrição: {nomeacao.inscricao}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {nomeacao.classificacao}º
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {nomeacao.dataDOU || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {nomeacao.dataPrazo ? (
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1 text-convoca-500" />
                            {nomeacao.dataPrazo}
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          nomeacao.status === 'Nomeado' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {nomeacao.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm ? "Nenhum candidato encontrado com esses critérios." : "Nenhuma nomeação registrada para este concurso ainda."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {selectedConcurso === "1" && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-8">
              <h3 className="font-medium text-gray-800 mb-3">Informações da última portaria de nomeação:</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li><span className="font-medium">Portaria:</span> Nº 342, de 10 de maio de 2025</li>
                <li><span className="font-medium">Publicação no DOU:</span> 15/05/2025, Seção 2, Página 45</li>
                <li><span className="font-medium">Quantidade de nomeados:</span> 50 candidatos</li>
                <li><span className="font-medium">Cargos:</span> Analista Administrativo</li>
                <li>
                  <a 
                    href="#" 
                    className="text-convoca-600 hover:text-convoca-800 underline"
                  >
                    Visualizar portaria completa (PDF)
                  </a>
                </li>
              </ul>
            </div>
          )}
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Próximos passos após a nomeação:</h3>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-2">
              <li>
                <span className="font-medium">Aguardar publicação no DOU</span>
                <p className="text-xs text-gray-600 mt-1">
                  A nomeação só é válida após publicação no Diário Oficial da União.
                </p>
              </li>
              <li>
                <span className="font-medium">Preparar documentação</span>
                <p className="text-xs text-gray-600 mt-1">
                  Reúna todos os documentos pessoais e comprovantes exigidos no edital.
                </p>
              </li>
              <li>
                <span className="font-medium">Exames médicos</span>
                <p className="text-xs text-gray-600 mt-1">
                  Realize os exames médicos necessários para a posse.
                </p>
              </li>
              <li>
                <span className="font-medium">Comparecer para a posse</span>
                <p className="text-xs text-gray-600 mt-1">
                  Dentro do prazo estipulado, compareça ao órgão para tomar posse do cargo.
                </p>
              </li>
              <li>
                <span className="font-medium">Entrada em exercício</span>
                <p className="text-xs text-gray-600 mt-1">
                  Após a posse, você tem até 15 dias para entrar em exercício no cargo.
                </p>
              </li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
};

export default Nomeacoes;
