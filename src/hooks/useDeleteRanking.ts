
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeleteRanking = () => {
  const queryClient = useQueryClient();

  const deleteRankingMutation = useMutation({
    mutationFn: async (concursoId: string) => {
      console.log('Iniciando exclusão do ranking:', concursoId);
      
      try {
        // 1. Primeiro buscar os IDs dos user_rankings para deletar dependências
        console.log('Buscando user_rankings para deletar dependências...');
        const { data: userRankings, error: fetchError } = await supabase
          .from('user_rankings')
          .select('id')
          .eq('concurso_id', concursoId);
        
        if (fetchError) {
          console.error('Erro ao buscar user_rankings:', fetchError);
          throw fetchError;
        }

        if (userRankings && userRankings.length > 0) {
          const userRankingIds = userRankings.map(ur => ur.id);
          
          // 2. Deletar score_calculation_logs primeiro (nova correção)
          console.log('Deletando score_calculation_logs...');
          const { error: logsError } = await supabase
            .from('score_calculation_logs')
            .delete()
            .in('user_ranking_id', userRankingIds);
          
          if (logsError) {
            console.error('Erro ao deletar score_calculation_logs:', logsError);
            throw logsError;
          }

          // 3. Deletar user_answers
          console.log('Deletando user_answers...');
          const { error: answersError } = await supabase
            .from('user_answers')
            .delete()
            .in('user_ranking_id', userRankingIds);
          
          if (answersError) {
            console.error('Erro ao deletar user_answers:', answersError);
            throw answersError;
          }
        }

        // 4. Deletar todos os user_rankings
        console.log('Deletando user_rankings...');
        const { error: rankingsError } = await supabase
          .from('user_rankings')
          .delete()
          .eq('concurso_id', concursoId);
        
        if (rankingsError) {
          console.error('Erro ao deletar user_rankings:', rankingsError);
          throw rankingsError;
        }

        // 5. Deletar official_answer_weights
        console.log('Deletando official_answer_weights...');
        const { error: weightsError } = await supabase
          .from('official_answer_weights')
          .delete()
          .eq('concurso_id', concursoId);
        
        if (weightsError) {
          console.error('Erro ao deletar official_answer_weights:', weightsError);
          // Não joga erro aqui pois pode não existir
        }

        // 6. Deletar exam_booklets
        console.log('Deletando exam_booklets...');
        const { error: bookletsError } = await supabase
          .from('exam_booklets')
          .delete()
          .eq('concurso_id', concursoId);
        
        if (bookletsError) {
          console.error('Erro ao deletar exam_booklets:', bookletsError);
          // Continua mesmo com erro nos cadernos
        }

        // 7. Finalmente deletar o concurso
        console.log('Deletando concurso...');
        const { error: concursoError } = await supabase
          .from('concursos')
          .delete()
          .eq('id', concursoId);
        
        if (concursoError) {
          console.error('Erro ao deletar concurso:', concursoError);
          throw concursoError;
        }

        console.log('Ranking deletado com sucesso:', concursoId);
        return { success: true };
      } catch (error) {
        console.error('Erro na exclusão do ranking:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Ranking deletado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      queryClient.invalidateQueries({ queryKey: ['concursos'] });
    },
    onError: (error: any) => {
      console.error('Erro ao deletar ranking:', error);
      toast.error(`Erro ao deletar ranking: ${error.message || 'Erro desconhecido'}`);
    }
  });

  return {
    deleteRanking: deleteRankingMutation.mutate,
    isDeleting: deleteRankingMutation.isPending
  };
};
