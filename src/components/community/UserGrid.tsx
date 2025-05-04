
import React, { ReactNode } from 'react';

interface UserGridProps {
  children: ReactNode;
  className?: string;
}

export const UserGrid: React.FC<UserGridProps> = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
      {children}
    </div>
  );
};
