
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeleteRanking = () => {
  const queryClient = useQueryClient();

  const deleteRankingMutation = useMutation({
    mutationFn: async (concursoId: string) => {
      console.log('Iniciando exclusão do ranking:', concursoId);
      
      try {
        // 1. Primeiro deletar todos os user_answers associados
        console.log('Deletando user_answers...');
        const { error: answersError } = await supabase
          .from('user_answers')
          .delete()
          .in('user_ranking_id', 
            supabase
              .from('user_rankings')
              .select('id')
              .eq('concurso_id', concursoId)
          );
        
        if (answersError) {
          console.error('Erro ao deletar user_answers:', answersError);
          throw answersError;
        }

        // 2. Depois deletar todos os user_rankings
        console.log('Deletando user_rankings...');
        const { error: rankingsError } = await supabase
          .from('user_rankings')
          .delete()
          .eq('concurso_id', concursoId);
        
        if (rankingsError) {
          console.error('Erro ao deletar user_rankings:', rankingsError);
          throw rankingsError;
        }

        // 3. Deletar official_answer_weights
        console.log('Deletando official_answer_weights...');
        const { error: weightsError } = await supabase
          .from('official_answer_weights')
          .delete()
          .eq('concurso_id', concursoId);
        
        if (weightsError) {
          console.error('Erro ao deletar official_answer_weights:', weightsError);
          // Não joga erro aqui pois pode não existir
        }

        // 4. Deletar answer_keys (gabarito antigo)
        console.log('Deletando answer_keys...');
        const { error: keysError } = await supabase
          .from('answer_keys')
          .delete()
          .eq('concurso_id', concursoId);
        
        if (keysError) {
          console.error('Erro ao deletar answer_keys:', keysError);
          // Não joga erro aqui pois pode não existir
        }

        // 5. Deletar exam_booklets usando a função RPC
        console.log('Deletando exam_booklets...');
        try {
          // Primeiro buscar os cadernos existentes
          const { data: bookletsData } = await supabase.rpc('manage_exam_booklets', {
            p_operation: 'GET',
            p_concurso_id: concursoId
          });
          
          if (bookletsData?.booklets) {
            for (const booklet of bookletsData.booklets) {
              await supabase.rpc('manage_exam_booklets', {
                p_operation: 'DELETE',
                p_booklet_id: booklet.id
              });
            }
          }
        } catch (bookletError) {
          console.error('Erro ao deletar cadernos:', bookletError);
          // Não joga erro aqui, continua com a exclusão do concurso
        }

        // 6. Finalmente deletar o concurso
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
