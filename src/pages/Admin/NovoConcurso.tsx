
import React from 'react';
import { useParams } from 'react-router-dom';
import RankingForm from '@/components/shared/RankingForm';

const NovoConcurso = () => {
  const { id } = useParams();
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{id ? 'Editar Ranking' : 'Novo Ranking'}</h1>
      <RankingForm isAdminView editId={id} />
    </div>
  );
};

export default NovoConcurso;
