
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Users, Clock, Palette } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTimer } from '@/contexts/TimerContext';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';

const UserMenu: React.FC = () => {
  const {
    user,
    signOut
  } = useAuth();
  const { isStudying, minutes, seconds, isRunning } = useTimer();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();

  const {
    data: profile
  } = useQuery({
    queryKey: ['user-profile-menu', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const {
        data,
        error
      } = await supabase.from('public_profiles').select('name, avatar_url').eq('id', user.id).single();
      if (error) return null;
      return data;
    },
    enabled: !!user
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      queryClient.clear();
      toast({
        title: 'Desconectado com sucesso',
        description: 'Você foi desconectado da sua conta.'
      });
      navigate('/', {
        replace: true
      });
    } catch (error) {
      toast({
        title: 'Erro ao desconectar',
        description: 'Ocorreu um erro ao tentar sair. Por favor, tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const themeOptions = [
    { value: 'emerald', label: 'Verde Esmeralda', color: 'bg-emerald-500' },
    { value: 'rose', label: 'Rosa', color: 'bg-rose-500' },
    { value: 'blue', label: 'Azul', color: 'bg-blue-500' },
    { value: 'slate', label: 'Preto', color: 'bg-slate-700' },
    { value: 'purple', label: 'Lilás', color: 'bg-purple-500' },
  ];

  if (!user) {
    return <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
          Fazer Login
        </Button>
      </div>;
  }

  const userName = profile?.name || user.user_metadata?.name || user.email || 'Usuário';

  return <div className="flex items-center gap-2">
      {isStudying && isRunning && (
        <Badge variant="secondary" className="flex items-center gap-1 bg-green-500/10 text-green-600 border-green-500/20">
          <Clock className="h-3 w-3" />
          <span className="font-mono text-xs">{formatTime(minutes, seconds)}</span>
          <span className="text-xs">• Estudando</span>
        </Badge>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              {profile?.avatar_url ? <AvatarImage src={profile?.avatar_url} alt={userName} /> : <AvatarFallback>{getInitials(userName)}</AvatarFallback>}
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
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex w-full cursor-pointer items-center">
              <Palette className="mr-2 h-4 w-4" />
              <span>Alterar Tema</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {themeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setTheme(option.value as any)}
                  className="flex w-full cursor-pointer items-center gap-2"
                >
                  <div className={`w-4 h-4 rounded-full ${option.color}`} />
                  <span>{option.label}</span>
                  {theme === option.value && <span className="ml-auto text-xs">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>;
};

export default UserMenu;
