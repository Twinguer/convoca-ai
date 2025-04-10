
import React from 'react';
import { Loader2 } from 'lucide-react';

export const CommunityLoadingState: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin mr-2" />
      <p className="text-lg">Carregando usuários...</p>
    </div>
  );
};
