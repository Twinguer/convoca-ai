
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchConcursos } from '../services/concursoService';

const Editais: React.FC = () => {
  // Use the updated fetchConcursos function with the correct parameter type
  const { data, isLoading, error } = useQuery({
    queryKey: ['editais'],
    queryFn: () => fetchConcursos({ status: 'Em andamento' }),
  });

  if (isLoading) {
    return <div>Carregando editais...</div>;
  }

  if (error) {
    return <div>Erro ao carregar editais.</div>;
  }

  return (
    <div>
      <h1>Editais em Andamento</h1>
      {data && data.length > 0 ? (
        <ul>
          {data.map((edital) => (
            <li key={edital.id}>{edital.titulo}</li>
          ))}
        </ul>
      ) : (
        <div>Nenhum edital encontrado.</div>
      )}
    </div>
  );
};

export default Editais;
