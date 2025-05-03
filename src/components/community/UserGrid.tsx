
import React, { ReactNode } from 'react';

interface UserGridProps {
  children: ReactNode;
  className?: string;
}

export const UserGrid: React.FC<UserGridProps> = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1 ${className}`}>
      {children}
    </div>
  );
};
