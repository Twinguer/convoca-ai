
import React from 'react';

export interface CommunitySectionHeaderProps {
  title?: string;
  description?: string;
  showDemoUsers?: boolean;
  icon?: React.ReactNode;
}

export const CommunitySectionHeader: React.FC<CommunitySectionHeaderProps> = ({
  title = "Comunidade",
  description = "Conecte-se com outros concurseiros e acompanhe seus progressos",
  showDemoUsers = false,
  icon
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
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
