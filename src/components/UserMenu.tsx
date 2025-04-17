
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Award, Users, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: profile } = useQuery({
    queryKey: ['user-profile-menu', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('users_profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user
  });
  
  const handleSignOut = async () => {
    try {
      await signOut();
      
      // Force clear session state and localStorage
      localStorage.removeItem('supabase.auth.token');
      
      toast({
        title: 'Desconectado com sucesso',
        description: 'Você foi desconectado da sua conta.',
        duration: 1500
      });
      
      // Force navigation to home page and refresh the page
      window.location.href = '/';
    } catch (error) {
      console.error('Error during sign out:', error);
      toast({
        title: 'Erro ao desconectar',
        description: 'Ocorreu um erro ao tentar sair. Por favor, tente novamente.',
        variant: 'destructive',
        duration: 1500
      });
    }
  };
  
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  
  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
        Fazer Login
      </Button>
    );
  }
  
  const userName = profile?.name || user.user_metadata?.name || user.email || 'Usuário';
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={userName} /> : <AvatarFallback>{getInitials(userName)}</AvatarFallback>}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-medium leading-none">{userName}</p>
          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/seguidores" className="flex w-full cursor-pointer items-center">
            <Users className="mr-2 h-4 w-4" />
            <span>Meus Seguidores</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/comunidade" className="flex w-full cursor-pointer items-center">
            <Users className="mr-2 h-4 w-4" />
            <span>Comunidade</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/perfil" className="flex w-full cursor-pointer items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
