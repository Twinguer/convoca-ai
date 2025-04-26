
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, AlertCircle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteProfileButtonProps {
  userId: string;
}

const DeleteProfileButton: React.FC<DeleteProfileButtonProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDeleteProfile = async () => {
    try {
      setIsDeleting(true);
      
      // Call the database function we created to delete the user's profile
      const { data, error } = await supabase.rpc('delete_user_profile', {
        user_id_param: userId
      });
      
      if (error) throw error;
      
      // Sign out the user
      await supabase.auth.signOut();
      
      toast({
        title: "Perfil excluído",
        description: "Seu perfil foi excluído com sucesso. Você será redirecionado para a página inicial.",
      });
      
      // Redirect to home page
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error: any) {
      console.error("Error deleting profile:", error);
      toast({
        title: "Erro ao excluir perfil",
        description: error.message || "Não foi possível excluir seu perfil. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)} 
        className="gap-1 text-xs text-gray-500 border-gray-300 hover:bg-gray-100 hover:text-gray-700 w-1/4"
      >
        <Trash2 className="h-3 w-3" />
        Excluir
      </Button>
      
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Excluir perfil
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente seu perfil
              e removerá todos os seus dados, incluindo rankings, respostas e relacionamentos com outros usuários.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteProfile();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Sim, excluir meu perfil"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteProfileButton;
