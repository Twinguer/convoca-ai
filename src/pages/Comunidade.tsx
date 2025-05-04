
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useCommunityUsers } from '@/hooks/useCommunityUsers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, RefreshCw } from 'lucide-react';
import { CommunityLoadingState } from '@/components/community/CommunityLoadingState';
import { CommunityErrorState } from '@/components/community/CommunityErrorState';
import { CommunityEmptyState } from '@/components/community/CommunityEmptyState';
import { UserCard } from '@/components/community/UserCard';
import { UserGrid } from '@/components/community/UserGrid';

/**
 * Comunidade page component
 * Displays a grid of user profiles from the community
 */
const Comunidade: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [rankingFilter, setRankingFilter] = useState('todos');
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch community users using the custom hook
  const {
    users,
    isLoading,
    isError,
    refetch
  } = useCommunityUsers(searchQuery);

  // Handle user card click - navigate to user profile
  const handleUserClick = useCallback((userId: string) => {
    navigate(`/usuario/${userId}`);
  }, [navigate]);

  // Handle refresh button click
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    toast({
      title: 'Atualizado',
      description: 'Lista de usuários atualizada com sucesso.'
    });
    setIsRefreshing(false);
  }, [refetch, toast]);

  // Handle search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  // Filter users based on selected filters
  const filteredUsers = React.useMemo(() => {
    let filtered = users || [];
    
    // Filter by status if not "todos"
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(user => user.status_concurseiro === statusFilter);
    }
    
    // Filter by ranking participation if needed
    if (rankingFilter !== 'todos') {
      const hasRankings = rankingFilter === '1';
      filtered = filtered.filter(user => {
        const userHasRankings = (user.postCount || 0) > 0;
        return hasRankings ? userHasRankings : !userHasRankings;
      });
    }

    // Sort users by follower count (descending order)
    filtered = [...filtered].sort((a, b) => (b.followerCount || 0) - (a.followerCount || 0));

    return filtered;
  }, [users, statusFilter, rankingFilter]);

  // Get users to display - either all or just the first 6
  const displayUsers = showAllUsers ? filteredUsers : filteredUsers.slice(0, 6);
  const hasMoreUsers = filteredUsers.length > 6;

  // Loading state
  if (isLoading) {
    return <CommunityLoadingState />;
  }

  // Error state - show error component with empty array as fallback
  if (isError) {
    return <CommunityErrorState handleUserClick={handleUserClick} />;
  }

  // Main component render
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Comunidade</h1>
        <p className="text-muted-foreground mt-1">Conecte-se com outros concurseiros e acompanhe seus progressos</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Input 
              type="text" 
              placeholder="Buscar usuários..." 
              value={searchQuery} 
              onChange={handleSearchChange} 
              className="w-full pl-10" 
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <Button 
            type="submit" 
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Buscar
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </form>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Aprovado">Aprovados</SelectItem>
              <SelectItem value="Estudante">Estudantes</SelectItem>
              <SelectItem value="Nomeado">Nomeados</SelectItem>
              <SelectItem value="Na Ativa">Na Ativa</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={rankingFilter} onValueChange={setRankingFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Rankings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="0">Sem rankings</SelectItem>
              <SelectItem value="1">Com rankings</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {displayUsers.length > 0 ? (
        <>
          <UserGrid>
            {displayUsers.map(user => (
              <UserCard 
                key={user.id} 
                userProfile={user} 
                onClick={handleUserClick}
              />
            ))}
          </UserGrid>
          
          {hasMoreUsers && (
            <div className="mt-8 flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => setShowAllUsers(!showAllUsers)} 
                className="px-8"
              >
                {showAllUsers ? "Mostrar menos" : `Ver mais usuários (${filteredUsers.length - 6})`}
              </Button>
            </div>
          )}
        </>
      ) : (
        <CommunityEmptyState onRefresh={handleRefresh} />
      )}
    </div>
  );
};

export default Comunidade;
