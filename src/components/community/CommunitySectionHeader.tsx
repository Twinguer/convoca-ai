
import React from 'react';

interface CommunitySectionHeaderProps {
  title: string;
  description: string;
  showDemoUsers?: boolean;
}

export const CommunitySectionHeader: React.FC<CommunitySectionHeaderProps> = ({
  title,
  description,
  showDemoUsers = false
}) => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-1">{description}</p>
      
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
