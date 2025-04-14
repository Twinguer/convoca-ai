
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const DeleteProfileDialog = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleDelete = async () => {
    if (!user) return;
    
    try {
      setIsDeleting(true);
      
      // First, delete all user data from database
      // This includes: user_rankings, user_answers, user_followers
      
      // 1. Delete user followers (both where user is followed or a follower)
      await supabase
        .from('user_followers')
        .delete()
        .or(`follower_id.eq.${user.id},followed_id.eq.${user.id}`);
      
      // 2. Get all user ranking IDs to delete answers
      const { data: rankings } = await supabase
        .from('user_rankings')
        .select('id')
        .eq('user_id', user.id);
        
      if (rankings && rankings.length > 0) {
        const rankingIds = rankings.map(r => r.id);
        
        // 3. Delete user answers
        await supabase
          .from('user_answers')
          .delete()
          .in('user_ranking_id', rankingIds);
          
        // 4. Delete user rankings
        await supabase
          .from('user_rankings')
          .delete()
          .eq('user_id', user.id);
      }
      
      // 5. Delete user profile
      await supabase
        .from('users_profiles')
        .delete()
        .eq('id', user.id);
      
      // 6. Delete user from auth
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;
      
      toast({
        title: "Perfil excluído",
        description: "Sua conta foi excluída com sucesso. Você será redirecionado para a página inicial.",
      });
      
      // Sign out the user
      await signOut();
      
      // Close dialog and redirect
      setIsOpen(false);
      navigate('/', { replace: true });
      
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      toast({
        title: "Erro ao excluir perfil",
        description: error.message || "Ocorreu um erro ao excluir seu perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Excluir meu perfil
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente a sua conta 
            e removerá todos os seus dados do nosso sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Sim, excluir meu perfil
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteProfileDialog;
