
import React from 'react';
import { ParticipationActions } from './ParticipationActions';
import type { Concurso } from '@/types/concursos';
import type { UserRanking } from '@/types/rankings';
import { User } from '@supabase/supabase-js';

interface PageHeaderProps {
  concurso: Concurso | null;
  userRanking: UserRanking | null;
  isAuthenticated: boolean;
  user: User | null;
  onRefresh: () => void;
  onParticipate: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  concurso,
  userRanking,
  isAuthenticated,
  user,
  onRefresh,
  onParticipate
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
      <h1 className="text-2xl sm:text-3xl font-bold flex items-center mx-[6px]">
        {concurso?.titulo ? `${concurso.titulo} - Resultados` : 'Rankings'}
      </h1>
      
      <ParticipationActions
        concursoId={concurso?.id}
        userRanking={userRanking}
        isAuthenticated={isAuthenticated}
        user={user}
        onRefresh={onRefresh}
        onParticipate={onParticipate}
      />
    </div>
  );
};
