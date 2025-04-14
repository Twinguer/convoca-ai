
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trophy, CheckCircle, LogIn } from 'lucide-react';
import type { UserRanking } from '@/types/rankings';
import { User } from '@supabase/supabase-js';

interface ParticipationActionsProps {
  concursoId?: string;
  userRanking: UserRanking | null;
  isAuthenticated: boolean;
  user: User | null;
  onRefresh: () => void;
  onParticipate: () => void;
}

export const ParticipationActions: React.FC<ParticipationActionsProps> = ({
  concursoId,
  userRanking,
  isAuthenticated,
  user,
  onRefresh,
  onParticipate
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex gap-1 sm:gap-2 flex-wrap">
      <Button 
        variant="outline" 
        onClick={onRefresh} 
        className="flex items-center gap-2 text-xs sm:text-sm" 
        size="sm"
      >
        <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
        Atualizar
      </Button>
      
      {concursoId && !userRanking && user && (
        <Button 
          onClick={onParticipate}
          className="flex items-center gap-2 text-xs sm:text-sm" 
          size="sm"
        >
          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          Participar
        </Button>
      )}
      
      {concursoId && !isAuthenticated && (
        <Button 
          onClick={() => navigate(`/auth`)} 
          variant="outline" 
          className="flex items-center gap-2 text-xs sm:text-sm" 
          size="sm"
        >
          <LogIn className="h-3 w-3 sm:h-4 sm:w-4" />
          Fazer Login
        </Button>
      )}
    </div>
  );
};
