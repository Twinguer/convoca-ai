import React from 'react';
import { VerificationPanel } from '@/components/debug/VerificationPanel';
import { useParams } from 'react-router-dom';

export const VerificationTest: React.FC = () => {
  const { concursoId } = useParams<{ concursoId: string }>();
  
  // Para este teste, vou usar um ranking ID fictício
  const rankingId = "5d61e9e7-66d9-4d8d-91e1-14e583cab54e";

  if (!concursoId) {
    return <div>Concurso ID não encontrado</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <VerificationPanel 
        concursoId={concursoId}
        rankingId={rankingId}
      />
    </div>
  );
};