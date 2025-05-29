
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeleteRanking = () => {
  const queryClient = useQueryClient();

  const deleteRankingMutation = useMutation({
    mutationFn: async (concursoId: string) => {
      console.log('Iniciando exclusão do ranking:', concursoId);
      
      try {
        // 1. Primeiro buscar os IDs dos user_rankings para deletar logs e respostas
        console.log('Buscando user_rankings para deletar dependências...');
        const { data: userRankings, error: fetchError } = await supabase
          .from('user_rankings')
          .select('id')
          .eq('concurso_id', concursoId);
        
        if (fetchError) {
          console.error('Erro ao buscar user_rankings:', fetchError);
          throw fetchError;
        }

        // 2. Deletar score_calculation_logs primeiro (nova dependência)
        if (userRankings && userRankings.length > 0) {
          console.log('Deletando score_calculation_logs...');
          const userRankingIds = userRankings.map(ur => ur.id);
          
          const { error: logsError } = await supabase
            .from('score_calculation_logs')
            .delete()
            .in('user_ranking_id', userRankingIds);
          
          if (logsError) {
            console.error('Erro ao deletar score_calculation_logs:', logsError);
            // Continua mesmo com erro nos logs
          }

          // 3. Deletar user_answers usando os IDs encontrados
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

        // 4. Deletar logs gerais de cálculo sem user_ranking_id específico
        console.log('Deletando logs gerais de cálculo...');
        const { error: generalLogsError } = await supabase
          .from('score_calculation_logs')
          .delete()
          .is('user_ranking_id', null)
          .like('calculation_details->>concurso_id', `%${concursoId}%`);
        
        if (generalLogsError) {
          console.error('Erro ao deletar logs gerais:', generalLogsError);
          // Continua mesmo com erro
        }

        // 5. Deletar todos os user_rankings
        console.log('Deletando user_rankings...');
        const { error: rankingsError } = await supabase
          .from('user_rankings')
          .delete()
          .eq('concurso_id', concursoId);
        
        if (rankingsError) {
          console.error('Erro ao deletar user_rankings:', rankingsError);
          throw rankingsError;
        }

        // 6. Deletar official_answer_weights
        console.log('Deletando official_answer_weights...');
        const { error: weightsError } = await supabase
          .from('official_answer_weights')
          .delete()
          .eq('concurso_id', concursoId);
        
        if (weightsError) {
          console.error('Erro ao deletar official_answer_weights:', weightsError);
          // Não joga erro aqui pois pode não existir
        }

        // 7. Deletar answer_keys (gabarito antigo)
        console.log('Deletando answer_keys...');
        const { error: keysError } = await supabase
          .from('answer_keys')
          .delete()
          .eq('concurso_id', concursoId);
        
        if (keysError) {
          console.error('Erro ao deletar answer_keys:', keysError);
          // Não joga erro aqui pois pode não existir
        }

        // 8. Deletar exam_booklets
        console.log('Deletando exam_booklets...');
        const { error: bookletsError } = await supabase
          .from('exam_booklets')
          .delete()
          .eq('concurso_id', concursoId);
        
        if (bookletsError) {
          console.error('Erro ao deletar exam_booklets:', bookletsError);
          // Continua mesmo com erro nos cadernos
        }

        // 9. Finalmente deletar o concurso
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
      queryClient.invalidateQueries({ queryKey: ['user-created-rankings'] });
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
