
import React from 'react';

export const CommunityEmptyState: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-[40vh]">
      <p className="text-lg text-gray-500">Nenhum usuário encontrado.</p>
      <p className="text-sm text-gray-400">Seja o primeiro a se cadastrar!</p>
    </div>
  );
};
