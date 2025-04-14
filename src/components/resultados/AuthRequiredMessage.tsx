
import React from 'react';

export const AuthRequiredMessage: React.FC = () => {
  return (
    <div className="mt-1 sm:mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
      <p className="text-center text-gray-600">
        Para participar deste ranking e comparar seu desempenho, faça login ou crie uma conta.
      </p>
    </div>
  );
};
