
import React, { ReactNode } from 'react';

interface UserGridProps {
  children: ReactNode;
  className?: string;
}

export const UserGrid: React.FC<UserGridProps> = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 ${className}`}>
      {children}
    </div>
  );
};
