
import React from 'react';

interface CommunitySectionHeaderProps {
  showDemoUsers: boolean;
}

export const CommunitySectionHeader: React.FC<CommunitySectionHeaderProps> = ({ 
  showDemoUsers 
}) => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">Comunidade</h1>
      <p className="text-gray-500">Conheça outros candidatos e compartilhe sua jornada</p>
      
      {showDemoUsers && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700 text-sm">
            <strong>Nota:</strong> Exibindo usuários de demonstração. Estes são exemplos e não refletem contas reais.
          </p>
        </div>
      )}
    </div>
  );
};
