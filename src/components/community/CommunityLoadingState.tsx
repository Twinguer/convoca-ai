
import React from 'react';
import { Loader2 } from 'lucide-react';

export const CommunityLoadingState: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh]">
      <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
      <p className="text-lg font-medium">Carregando usuários...</p>
      <p className="text-sm text-muted-foreground mt-2">Buscando os perfis da comunidade</p>
    </div>
  );
};
