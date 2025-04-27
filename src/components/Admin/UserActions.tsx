
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Shield, Ban, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface UserActionsProps {
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

export const UserActions: React.FC<UserActionsProps> = ({ userId, userName, onSuccess }) => {
  const { toast } = useToast();

  const handleBanUser = async () => {
    try {
      // In a real implementation, this would call an admin API to ban the user
      // For now, we'll just show a toast message
      toast({
        title: "Usuário banido",
        description: `${userName} foi banido temporariamente.`,
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível completar a ação.",
        variant: "destructive"
      });
    }
  };

  const handleMakeAdmin = async () => {
    try {
      // In a real implementation, this would call an admin API to give admin rights
      // For now, we'll just show a toast message
      toast({
        title: "Permissões atualizadas",
        description: `${userName} agora tem permissões de administrador.`,
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível completar a ação.",
        variant: "destructive"
      });
    }
  };

  const handleReportUser = async () => {
    try {
      // In a real implementation, this would create a user report
      // For now, we'll just show a toast message
      toast({
        title: "Usuário reportado",
        description: `${userName} foi reportado para análise.`,
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível completar a ação.",
        variant: "destructive"
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Opções de administrador</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleMakeAdmin}>
          <Shield className="mr-2 h-4 w-4" /> Tornar admin
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleBanUser}>
          <Ban className="mr-2 h-4 w-4" /> Banir usuário
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleReportUser}>
          <AlertCircle className="mr-2 h-4 w-4" /> Reportar usuário
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
