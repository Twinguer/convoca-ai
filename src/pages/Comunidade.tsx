import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { UserCard } from '@/components/community/UserCard';
import { UserGrid } from '@/components/community/UserGrid';
import { CommunityLoadingState } from '@/components/community/CommunityLoadingState';
import { CommunityErrorState } from '@/components/community/CommunityErrorState';
import { CommunityEmptyState } from '@/components/community/CommunityEmptyState';
import { CommunitySectionHeader } from '@/components/community/CommunitySectionHeader';
import { useCommunityUsers } from '@/hooks/useCommunityUsers';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

/**
 * Comunidade page component
 * Displays a grid of user profiles from the community
 */
const Comunidade: React.FC = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch community users using the custom hook
  const {
    users,
    demoUsers,
    isLoading,
    isError,
    showDemoUsers,
    refetch
  } = useCommunityUsers(searchQuery);

  // Handle user card click - navigate to user profile
  const handleUserClick = useCallback((userId: string) => {
    if (showDemoUsers) {
      // For demo users, show a toast instead of navigating
      toast({
        title: 'Demonstração',
        description: 'Este é um usuário de demonstração. Em uma conta real, você seria redirecionado para o perfil.'
      });
    } else {
      navigate(`/usuario/${userId}`);
    }
  }, [navigate, showDemoUsers, toast]);

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    refetch();
    toast({
      title: 'Atualizando',
      description: 'Buscando usuários mais recentes...'
    });
  }, [refetch, toast]);

  // Handle search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Note: We're using the useDebounce hook in the useCommunityUsers hook
    // so we don't need to debounce the search here
  };

  // Loading state
  if (isLoading) {
    return <CommunityLoadingState />;
  }

  // Error state - show error component with demo users as fallback
  if (isError) {
    return <CommunityErrorState demoUsers={demoUsers} handleUserClick={handleUserClick} />;
  }

  // Determine which users to display (real or demo)
  const displayUsers = users && users.length > 0 ? users : showDemoUsers ? demoUsers : [];
  return <div className="container mx-auto p-6">
      {/* Section header with demo indicator if needed */}
      <CommunitySectionHeader showDemoUsers={showDemoUsers} />
      
      {/* Search box */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <Input type="text" placeholder="Buscar por nome..." value={searchQuery} onChange={handleSearchChange} className="pl-10 w-full md:w-80" />
        
      </div>
      
      {/* Display user grid or empty state */}
      {displayUsers.length > 0 ? <UserGrid>
          {displayUsers.map(userProfile => <UserCard key={userProfile.id} userProfile={userProfile} onClick={handleUserClick} />)}
        </UserGrid> : <CommunityEmptyState onRefresh={handleRefresh} />}
    </div>;
};
export default Comunidade;