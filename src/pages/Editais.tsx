
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursos } from '../services/concursoService';
import ConcursoCard from '../components/ConcursoCard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RankingItem } from '../components/rankings/RankingList';

const Editais: React.FC = () => {
  // Use the updated fetchConcursos function with the correct parameter type
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ['editais'],
    queryFn: () => fetchConcursos({
      status: 'Em andamento'
    })
  });

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]">
      <p className="text-lg">Carregando editais...</p>
    </div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-[60vh]">
      <p className="text-lg text-red-500">Erro ao carregar editais.</p>
    </div>;
  }

  return <div className="container mx-auto p-6">
      
      {data && data.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map(edital => <div key={edital.id} className="border p-5 shadow-sm hover:shadow-md transition-shadow rounded-lg">
              <ConcursoCard id={edital.id} titulo={edital.titulo} orgao={edital.orgao} data={edital.data_publicacao ? format(new Date(edital.data_publicacao), 'dd/MM/yyyy', {
          locale: ptBR
        }) : 'Data não definida'} vagas={edital.vagas || 0} status={edital.status} />
              
              {/* Replacing Recursos card with RankingItem */}
              <div className="mt-4">
                <RankingItem
                  id={edital.id}
                  examDate={edital.data_publicacao || new Date().toISOString()}
                  banca={edital.banca || 'Sem banca definida'} 
                  concursoTitle={edital.orgao || 'Sem órgão definido'}
                  cargoTitle={edital.titulo || 'Sem título definido'}
                  participantCount={0}
                  status={edital.status || 'Em andamento'}
                />
              </div>
            </div>)}
        </div> : <div className="flex justify-center items-center min-h-[40vh]">
          <p className="text-lg text-gray-500">Nenhum edital encontrado.</p>
        </div>}
    </div>;
};

export default Editais;
