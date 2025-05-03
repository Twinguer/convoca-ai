
import React from 'react';
import { UserPlus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface CommunityEmptyStateProps {
  onRefresh?: () => void;
}

export const CommunityEmptyState: React.FC<CommunityEmptyStateProps> = ({ onRefresh }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col justify-center items-center min-h-[40vh] p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
      <UserPlus className="h-16 w-16 text-gray-400 mb-4" />
      <p className="text-xl font-medium text-gray-700 dark:text-gray-200">Nenhum usuário encontrado.</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6 text-center max-w-md">
        Seja o primeiro a se cadastrar ou tente atualizar a página para carregar os perfis existentes.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 mt-2">
        <Button 
          onClick={() => navigate('/auth')}
          className="flex items-center bg-emerald-600 hover:bg-emerald-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Criar perfil
        </Button>
        
        {onRefresh && (
          <Button 
            variant="outline" 
            onClick={onRefresh}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        )}
      </div>
    </div>
  );
};
