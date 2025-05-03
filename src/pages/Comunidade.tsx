
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useCommunityUsers } from '@/hooks/useCommunityUsers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCard } from '@/components/community/UserCard';
import { UserGrid } from '@/components/community/UserGrid';
import { MapPin, User, Users, BookOpen } from 'lucide-react';
import { CommunityLoadingState } from '@/components/community/CommunityLoadingState';
import { CommunityErrorState } from '@/components/community/CommunityErrorState';
import { CommunityEmptyState } from '@/components/community/CommunityEmptyState';

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
  const [statusFilter, setStatusFilter] = useState('todos');
  const [rankingFilter, setRankingFilter] = useState('todos');

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
  };

  // Handle search form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  // Filter users based on selected filters
  const filteredUsers = React.useMemo(() => {
    let filtered = users && users.length > 0 ? users : showDemoUsers ? demoUsers : [];
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(user => user.status_concurseiro === statusFilter);
    }

    // We could add more filters here based on rankings count, etc.

    return filtered;
  }, [users, demoUsers, showDemoUsers, statusFilter]);

  // Loading state
  if (isLoading) {
    return <CommunityLoadingState />;
  }

  // Error state - show error component with demo users as fallback
  if (isError) {
    return <CommunityErrorState demoUsers={demoUsers} handleUserClick={handleUserClick} />;
  }

  // Get status badges for user cards
  const getUserStatusBadge = (status: string | null) => {
    if (!status) return null;
    switch (status) {
      case 'Aprovado':
        return <div className="absolute top-4 right-4 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
            Aprovado
          </div>;
      case 'Estudante':
        return <div className="absolute top-4 right-4 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
            Estudante
          </div>;
      case 'Nomeado':
        return <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-1 rounded-full">
            Nomeado
          </div>;
      default:
        return null;
    }
  };
  return <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Comunidade</h1>
        <p className="text-muted-foreground mt-1">
          Conecte-se com outros concurseiros e acompanhe seus progressos
        </p>
      </div>
      
      {showDemoUsers && <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700 text-sm">
            <strong>Nota:</strong> Exibindo usuários de demonstração. Estes são exemplos e não refletem contas reais.
          </p>
        </div>}
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Input type="text" placeholder="Buscar usuários..." value={searchQuery} onChange={handleSearchChange} className="w-full pl-10" />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Buscar</Button>
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
      
      {filteredUsers.length > 0 ? <UserGrid className="gap-1">
          {filteredUsers.map(user => (
            <UserCard key={user.id} userProfile={user} onClick={handleUserClick} />
          ))}
        </UserGrid> : <CommunityEmptyState onRefresh={handleRefresh} />}
    </div>;
};
export default Comunidade;
