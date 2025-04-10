
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
    <div className="flex flex-col justify-center items-center min-h-[40vh] p-6 border border-dashed border-gray-300 rounded-lg bg-gray-50">
      <UserPlus className="h-12 w-12 text-gray-400 mb-4" />
      <p className="text-lg font-medium text-gray-700">Nenhum usuário encontrado.</p>
      <p className="text-sm text-gray-500 mt-2 mb-4 text-center">
        Seja o primeiro a se cadastrar ou tente atualizar a página para carregar os perfis existentes.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-2 mt-2">
        <Button 
          variant="outline" 
          onClick={() => navigate('/auth')}
          className="flex items-center"
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
