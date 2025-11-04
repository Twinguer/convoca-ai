
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeleteRanking = () => {
  const queryClient = useQueryClient();

  const deleteRankingMutation = useMutation({
    mutationFn: async (concursoId: string) => {
      // console.log('Iniciando exclusão do ranking:', concursoId);
      
      try {
        // 1. Primeiro buscar os IDs dos user_rankings para deletar dependências
        // console.log('Buscando user_rankings para deletar dependências...');
        const { data: userRankings, error: fetchError } = await supabase
          .from('user_rankings')
          .select('user_id, consolidated_data')
          .not('consolidated_data', 'is', null);
        
        if (fetchError) {
          console.error('Erro ao buscar user_rankings:', fetchError);
          throw fetchError;
        }
        
        // Filter user_rankings that have this concurso in their consolidated_data
        const relevantUserRankings = userRankings?.filter(ur => 
          ur.consolidated_data?.rankings?.[concursoId]
        ) || [];

        if (relevantUserRankings && relevantUserRankings.length > 0) {
          const userIds = relevantUserRankings.map(ur => ur.user_id);
          
          // 2. Deletar score_calculation_logs primeiro - CORREÇÃO CRUCIAL
          console.log('Deletando score_calculation_logs...');
          const { error: logsError } = await supabase
            .from('score_calculation_logs')
            .delete()
            .in('user_ranking_id', userIds);
          
          if (logsError) {
            console.error('Erro ao deletar score_calculation_logs:', logsError);
            throw logsError;
          }

          // 3. user_answers não é mais usado - dados estão em user_rankings consolidated_data
          // A remoção dos dados consolidados é feita automaticamente via CASCADE
          // Debug logs removed for security
          
          // 4. Remove concurso from consolidated_data for each user
          for (const userId of userIds) {
            const { data: userRankingData, error: fetchUserError } = await supabase
              .from('user_rankings')
              .select('consolidated_data')
              .eq('user_id', userId)
              .maybeSingle();
              
            if (!fetchUserError && userRankingData?.consolidated_data) {
              const updatedData = { ...userRankingData.consolidated_data };
              if (updatedData.rankings && updatedData.rankings[concursoId]) {
                delete updatedData.rankings[concursoId];
                
                await supabase
                  .from('user_rankings')
                  .update({ consolidated_data: updatedData })
                  .eq('user_id', userId);
              }
            }
          }
        }

        // 5. official_answer_weights agora são gerenciados via JSONB na tabela concursos
        console.log('official_answer_weights são gerenciados via JSONB na tabela concursos - não precisa deletar');

        // 6. Cadernos são gerenciados via JSONB na tabela concursos
        console.log('Cadernos são gerenciados via JSONB na tabela concursos - não precisa deletar');

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

        // console.log('Ranking deletado com sucesso:', concursoId);
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
      queryClient.invalidateQueries({ queryKey: ['admin-concursos'] });
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
