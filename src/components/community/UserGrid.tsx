
import React, { ReactNode } from 'react';
import { UserCard } from './UserCard';

interface User {
  id?: string;
  username: string;
  followerCount: number;
  postCount: number;
  approvalCount: number;
  status_concurseiro: string;
  email: string;
  bio: string;
  concursos_aprovados: any;
  concursos_participando: any;
  avatar_url: string;
}

interface UserGridProps {
  children?: ReactNode;
  users?: User[];
  className?: string;
  onClick?: (userId: string) => void;
}

export const UserGrid: React.FC<UserGridProps> = ({ children, users, className = '', onClick }) => {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0.5 ${className}`}>
      {users && users.map((user, index) => {
        // Map the user data to match UserCard's expected interface
        const userProfile = {
          id: user.id || `user-${index}`,
          name: user.username || user.email.split('@')[0],
          username: user.username,
          avatar_url: user.avatar_url,
          bio: user.bio,
          email: user.email,
          concursos_aprovados: user.concursos_aprovados,
          followerCount: user.followerCount,
          postCount: user.postCount,
          approvalCount: user.approvalCount,
          status_concurseiro: user.status_concurseiro,
        };
        
        return (
          <UserCard 
            key={user.id || user.email || index} 
            userProfile={userProfile}
            onClick={onClick}
          />
        );
      })}
      {children}
    </div>
  );
};
