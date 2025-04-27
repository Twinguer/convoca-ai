
import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, PenSquare, Settings, Trash2 } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface RankingManagementProps {
  concursoId: string;
  isCreator: boolean;
  onDeleteRanking?: () => Promise<void>;
}

export const RankingManagement = ({
  concursoId,
  isCreator,
  onDeleteRanking
}: RankingManagementProps) => {
  const navigate = useNavigate();

  if (!isCreator) return null;
  
  const handleEditAnswerKey = () => {
    navigate(`/concurso/${concursoId}/editar-gabarito`);
  };

  const handleDeleteRanking = async () => {
    if (window.confirm("Tem certeza que deseja excluir este ranking? Esta ação não pode ser desfeita.")) {
      try {
        if (onDeleteRanking) {
          await onDeleteRanking();
          toast.success("Ranking excluído com sucesso");
          navigate("/");
        }
      } catch (error: any) {
        toast.error(`Erro ao excluir ranking: ${error.message}`);
      }
    }
  };
  
  return (
    <div className="mb-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Gerenciar Ranking
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Opções de Gerenciamento</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleEditAnswerKey} className="gap-2">
            <PenSquare className="h-4 w-4" />
            Editar Gabarito
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDeleteRanking} 
            className="text-red-600 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Excluir Ranking
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
