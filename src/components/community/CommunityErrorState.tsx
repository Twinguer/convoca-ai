
import React from 'react';
import { UserGrid } from './UserGrid';
import { UserCard } from './UserCard';

interface UserProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  email: string;
  concursos_aprovados?: string | null;
  followerCount: number;
  postCount: number;
  approvalCount: number;
}

interface CommunityErrorStateProps {
  demoUsers: UserProfile[];
  handleUserClick: (userId: string) => void;
}

export const CommunityErrorState: React.FC<CommunityErrorStateProps> = ({ 
  demoUsers, 
  handleUserClick 
}) => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Comunidade</h1>
        <div className="mt-4 p-4 border border-red-300 bg-red-50 rounded-md">
          <p className="text-red-700">
            Ocorreu um erro ao carregar os usuários. Tente novamente mais tarde.
          </p>
        </div>
      </div>
      <UserGrid>
        {demoUsers.map((userProfile) => (
          <UserCard 
            key={userProfile.id} 
            userProfile={userProfile} 
            onClick={handleUserClick} 
          />
        ))}
      </UserGrid>
    </div>
  );
};
