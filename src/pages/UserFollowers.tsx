
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, User } from 'lucide-react';

// This is a placeholder page for the followers feature
// In a real implementation, this would connect to a followers table in the database

const UserFollowers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Mock followers and following data
  const mockUsers = [
    { id: '1', name: 'Ana Silva', avatar_url: null, bio: 'Aprovada em 3 concursos federais' },
    { id: '2', name: 'João Pereira', avatar_url: null, bio: 'Estudante de Direito, futuro Juiz Federal' },
    { id: '3', name: 'Maria Oliveira', avatar_url: null, bio: 'Concurseira desde 2018, aprovada no BB' },
    { id: '4', name: 'Carlos Santos', avatar_url: null, bio: 'Professor de matemática para concursos' },
    { id: '5', name: 'Juliana Costa', avatar_url: null, bio: 'Técnica Judiciária TRF-4' },
    { id: '6', name: 'Roberto Almeida', avatar_url: null, bio: 'Especialista em Direito Administrativo' },
    { id: '7', name: 'Fernanda Lima', avatar_url: null, bio: 'Estudando para o TCU' },
    { id: '8', name: 'Paulo Mendes', avatar_url: null, bio: 'Auditor Fiscal da Receita Federal' },
  ];
  
  // In a real app, we would fetch followers from the database
  const { data: followers, isLoading: isLoadingFollowers } = useQuery({
    queryKey: ['followers', user?.id],
    queryFn: async () => {
      // Simulating an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockUsers.slice(0, 5); // First 5 users as followers
    },
    enabled: !!user
  });
  
  // And similarly for users that the current user is following
  const { data: following, isLoading: isLoadingFollowing } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      // Simulating an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockUsers.slice(3, 8); // Last 5 users as following
    },
    enabled: !!user
  });
  
  // Generate initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  
  if (!user) {
    return (
      <div className="container mx-auto p-4 text-center py-12">
        <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Faça login para ver seus seguidores</h2>
        <p className="text-muted-foreground mb-6">
          Você precisa estar conectado para acessar esta página
        </p>
        <Button onClick={() => navigate('/auth')}>
          Fazer login
        </Button>
      </div>
    );
  }
  
  const renderUserList = (users: any[] | undefined, isLoading: boolean, emptyMessage: string) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      );
    }
    
    if (!users || users.length === 0) {
      return (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map(user => (
          <Card key={user.id} className="overflow-hidden">
            <div className="p-4 flex space-x-4">
              <Avatar className="h-16 w-16">
                {user.avatar_url ? (
                  <AvatarImage src={user.avatar_url} alt={user.name} />
                ) : (
                  <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex-1">
                <h3 className="font-medium">{user.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{user.bio}</p>
                
                <div className="mt-3 flex space-x-2">
                  <Button variant="outline" size="sm">Ver perfil</Button>
                  <Button size="sm" className="px-3">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Seguir
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto p-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Rede de Contatos</h1>
      
      <Tabs defaultValue="followers">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-6">
          <TabsTrigger value="followers">
            <Users className="h-4 w-4 mr-2" />
            Seguidores
          </TabsTrigger>
          <TabsTrigger value="following">
            <UserPlus className="h-4 w-4 mr-2" />
            Seguindo
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="followers">
          <Card>
            <CardHeader>
              <CardTitle>Meus Seguidores</CardTitle>
              <CardDescription>
                Pessoas que seguem sua atividade e resultados em concursos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderUserList(
                followers, 
                isLoadingFollowers, 
                "Você ainda não tem seguidores. Compartilhe seu perfil para aumentar sua rede!"
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="following">
          <Card>
            <CardHeader>
              <CardTitle>Pessoas que você segue</CardTitle>
              <CardDescription>
                Candidatos e profissionais que você acompanha
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderUserList(
                following, 
                isLoadingFollowing, 
                "Você ainda não está seguindo ninguém. Encontre outros candidatos para ampliar sua rede!"
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 text-center">
        <p className="text-muted-foreground mb-4">
          Esta é uma demonstração do sistema de seguidores. Na implementação final, 
          você poderá se conectar com outros candidatos e acompanhar seus resultados.
        </p>
        <Button onClick={() => navigate('/perfil')}>
          Voltar ao perfil
        </Button>
      </div>
    </div>
  );
};

export default UserFollowers;
