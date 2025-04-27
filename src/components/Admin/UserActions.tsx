
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, UserX } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserActionsProps {
  userId: string;
  rankingId?: string;
  userName: string;
  onSuccess?: () => void;
  showOnlyRankingActions?: boolean;
}

export const UserActions: React.FC<UserActionsProps> = ({ 
  userId, 
  rankingId, 
  userName,
  onSuccess,
  showOnlyRankingActions = false
}) => {
  const { toast } = useToast();
  const [showDeleteFromRanking, setShowDeleteFromRanking] = React.useState(false);
  const [showDeleteProfile, setShowDeleteProfile] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleDeleteFromRanking = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .rpc('admin_delete_user_from_ranking', {
          ranking_id_param: rankingId
        });

      if (error) throw error;

      toast({
        title: "Usuário removido do ranking",
        description: `${userName} foi removido com sucesso do ranking.`
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error deleting user from ranking:', error);
      toast({
        title: "Erro ao remover usuário",
        description: error.message || "Não foi possível remover o usuário do ranking.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setShowDeleteFromRanking(false);
    }
  };

  const handleDeleteProfile = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .rpc('admin_delete_user_profile', {
          user_id_param: userId
        });

      if (error) throw error;

      toast({
        title: "Perfil excluído",
        description: `O perfil de ${userName} foi excluído com sucesso.`
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error deleting user profile:', error);
      toast({
        title: "Erro ao excluir perfil",
        description: error.message || "Não foi possível excluir o perfil do usuário.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setShowDeleteProfile(false);
    }
  };

  return (
    <div className="flex gap-2">
      {rankingId && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteFromRanking(true)}
            className="text-red-600 hover:text-red-700"
          >
            <UserX className="h-4 w-4 mr-1" />
            Remover do Ranking
          </Button>

          <AlertDialog open={showDeleteFromRanking} onOpenChange={setShowDeleteFromRanking}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover usuário do ranking</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover {userName} deste ranking? 
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteFromRanking}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? "Removendo..." : "Sim, remover"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {!showOnlyRankingActions && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteProfile(true)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir Perfil
          </Button>

          <AlertDialog open={showDeleteProfile} onOpenChange={setShowDeleteProfile}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir perfil do usuário</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o perfil de {userName}? 
                  Esta ação removerá todas as participações em rankings e não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteProfile}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? "Excluindo..." : "Sim, excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};
