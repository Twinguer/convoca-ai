import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useCommunityUsers } from '@/hooks/useCommunityUsers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
      
      {filteredUsers.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map(user => {
        // Format location (city, state)
        const cityState = user.bio?.match(/(?:de |em |do |da )([^,.]+)/i)?.[1] || '';
        return <Card key={user.id} className="overflow-hidden relative hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleUserClick(user.id)}>
                {user.status_concurseiro && getUserStatusBadge(user.status_concurseiro)}
                
                <CardContent className="p-6 bg-slate-50">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                      <AvatarFallback>
                        {user.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h2 className="font-semibold text-lg">{user.name}</h2>
                      {cityState && <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          <span>{cityState}</span>
                        </div>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-lg">{user.postCount}</span>
                      <span className="text-xs text-muted-foreground">Rankings</span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-lg">{user.followerCount}</span>
                      <span className="text-xs text-muted-foreground">Seguidores</span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-lg">{user.approvalCount || 0}</span>
                      <span className="text-xs text-muted-foreground">Seguindo</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full mt-4 border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                    <User className="h-4 w-4 mr-2" />
                    Ver Perfil
                  </Button>
                </CardContent>
              </Card>;
      })}
        </div> : <CommunityEmptyState onRefresh={handleRefresh} />}
    </div>;
};
export default Comunidade;