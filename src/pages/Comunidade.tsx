
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { UserCard } from '@/components/community/UserCard';
import { UserGrid } from '@/components/community/UserGrid';
import { CommunityLoadingState } from '@/components/community/CommunityLoadingState';
import { CommunityErrorState } from '@/components/community/CommunityErrorState';
import { CommunityEmptyState } from '@/components/community/CommunityEmptyState';
import { CommunitySectionHeader } from '@/components/community/CommunitySectionHeader';
import { useCommunityUsers } from '@/hooks/useCommunityUsers';

const Comunidade: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    users, 
    demoUsers, 
    isLoading, 
    isError, 
    showDemoUsers 
  } = useCommunityUsers();

  const handleUserClick = (userId: string) => {
    if (showDemoUsers) {
      // Para usuários de demonstração, apenas mostrar um toast ao invés de navegar
      toast({
        title: 'Demonstração',
        description: 'Este é um usuário de demonstração. Em uma conta real, você seria redirecionado para o perfil.',
      });
    } else {
      navigate(`/usuario/${userId}`);
    }
  };

  if (isLoading) {
    return <CommunityLoadingState />;
  }

  if (isError) {
    return <CommunityErrorState demoUsers={demoUsers} handleUserClick={handleUserClick} />;
  }

  // Determinar quais usuários mostrar (reais ou demo)
  const displayUsers = (users && users.length > 0) ? users : (showDemoUsers ? demoUsers : []);

  return (
    <div className="container mx-auto p-6">
      <CommunitySectionHeader showDemoUsers={showDemoUsers} />
      
      {displayUsers.length > 0 ? (
        <UserGrid>
          {displayUsers.map((userProfile) => (
            <UserCard 
              key={userProfile.id} 
              userProfile={userProfile} 
              onClick={handleUserClick} 
            />
          ))}
        </UserGrid>
      ) : (
        <CommunityEmptyState />
      )}
    </div>
  );
};

export default Comunidade;
