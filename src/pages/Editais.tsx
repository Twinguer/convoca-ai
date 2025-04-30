
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursos } from '../services/concursoService';
import ConcursoCard from '../components/ConcursoCard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      
      {data && data.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {data.map(edital => <div key={edital.id} className="border p-5 shadow-sm hover:shadow-md transition-shadow px-0 py-px rounded-lg">
              <ConcursoCard id={edital.id} titulo={edital.titulo} orgao={edital.orgao} data={edital.data_publicacao ? format(new Date(edital.data_publicacao), 'dd/MM/yyyy', {
          locale: ptBR
        }) : 'Data não definida'} vagas={edital.vagas || 0} status={edital.status} />
            </div>)}
        </div> : <div className="flex justify-center items-center min-h-[40vh]">
          <p className="text-lg text-gray-500">Nenhum edital encontrado.</p>
        </div>}
    </div>;
};

export default Editais;
