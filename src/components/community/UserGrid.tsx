
import React, { ReactNode } from 'react';

interface UserGridProps {
  children: ReactNode;
}

export const UserGrid: React.FC<UserGridProps> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
};
