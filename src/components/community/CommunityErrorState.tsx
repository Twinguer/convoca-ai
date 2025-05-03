
import React from 'react';
import { AlertTriangle, RefreshCw, MapPin, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  status_concurseiro?: string | null;
}

interface CommunityErrorStateProps {
  demoUsers: UserProfile[];
  handleUserClick: (userId: string) => void;
}

export const CommunityErrorState: React.FC<CommunityErrorStateProps> = ({ 
  demoUsers, 
  handleUserClick 
}) => {
  const getUserStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    switch(status) {
      case 'Aprovado':
        return (
          <div className="absolute top-4 right-4 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
            Aprovado
          </div>
        );
      case 'Estudante':
        return (
          <div className="absolute top-4 right-4 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
            Estudante
          </div>
        );
      case 'Nomeado':
        return (
          <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-1 rounded-full">
            Nomeado
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Comunidade</h1>
        <p className="text-muted-foreground mt-1">
          Conecte-se com outros concurseiros e acompanhe seus progressos
        </p>
      </div>
      
      <div className="flex items-center p-4 mb-6 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
        <AlertTriangle className="w-5 h-5 mr-2" />
        <span className="font-medium">Ocorreu um erro ao carregar os usuários da comunidade.</span>
        <Button variant="link" className="ml-auto p-0" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Tentar novamente
        </Button>
      </div>
      
      <div className="mb-6">
        <h2 className="font-medium text-lg">Usuários de demonstração</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demoUsers.map((user) => {
          // Format location (city, state)
          const cityState = user.bio?.match(/(?:de |em |do |da )([^,.]+)/i)?.[1] || '';
          
          return (
            <Card 
              key={user.id} 
              className="overflow-hidden relative hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleUserClick(user.id)}
            >
              {user.status_concurseiro && getUserStatusBadge(user.status_concurseiro)}
              
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                    <AvatarFallback>
                      {user.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h2 className="font-semibold text-lg">{user.name}</h2>
                    {cityState && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        <span>{cityState}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-6 text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-semibold text-lg">{user.postCount}</span>
                    <span className="text-xs text-muted-foreground">Concursos</span>
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
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                >
                  <User className="h-4 w-4 mr-2" />
                  Ver Perfil
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
