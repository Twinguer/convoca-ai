import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { rankingCache } from '@/services/rankingCache';

export const useLeaveRanking = () => {
  const queryClient = useQueryClient();

  const { mutate: leave, isPending: isLeaving } = useMutation({
    mutationFn: async (concursoId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar o ranking do usuário
      const { data: ranking, error: rankingError } = await supabase
        .from('user_rankings')
        .select('id')
        .eq('concurso_id', concursoId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (rankingError) throw rankingError;
      if (!ranking) throw new Error('Você não está participando deste ranking');

      const rankingId = ranking.id;

      // Remover usuário do JSON consolidado
      const { data: consolidatedData, error: consolidatedError } = await supabase
        .from('consolidated_answers_by_concurso')
        .select('consolidated_data')
        .eq('concurso_id', concursoId)
        .single();

      if (consolidatedError && consolidatedError.code !== 'PGRST116') {
        console.error('Error fetching consolidated data:', consolidatedError);
      }

      if (consolidatedData?.consolidated_data) {
        const updatedData = { ...consolidatedData.consolidated_data };
        if (updatedData.users && updatedData.users[user.id]) {
          delete updatedData.users[user.id];
          
          // Atualizar contagem de usuários
          if (updatedData.metadata) {
            updatedData.metadata.total_users = Object.keys(updatedData.users).length;
            updatedData.metadata.last_updated = new Date().toISOString();
          }

          await supabase
            .from('consolidated_answers_by_concurso')
            .update({ consolidated_data: updatedData, updated_at: new Date().toISOString() })
            .eq('concurso_id', concursoId);
        }
      }

      // Deletar registros relacionados
      await supabase.from('score_calculation_logs').delete().eq('user_ranking_id', rankingId);
      await supabase.from('user_answers').delete().eq('user_ranking_id', rankingId);
      
      const { error: deleteError } = await supabase
        .from('user_rankings')
        .delete()
        .eq('id', rankingId);

      if (deleteError) throw deleteError;

      return { success: true };
    },
    onSuccess: (data, concursoId) => {
      console.log('[useLeaveRanking] 🎉 Usuário saiu do ranking com sucesso, invalidando queries...');
      toast.success('Você saiu do ranking com sucesso');
      
      // Limpar cache local para forçar busca de dados frescos
      console.log('[useLeaveRanking] 🗑️ Limpando cache local...');
      rankingCache.clear();
      
      // Invalidar todas as queries relacionadas ao concurso para refresh automático
      queryClient.invalidateQueries({ queryKey: ['rankings', concursoId] });
      queryClient.invalidateQueries({ queryKey: ['participant-count-v2', concursoId] });
      queryClient.invalidateQueries({ queryKey: ['user-participation-v2', concursoId] });
      queryClient.invalidateQueries({ queryKey: ['concurso', concursoId] });
      
      // Invalidar queries gerais também
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      queryClient.invalidateQueries({ queryKey: ['participant-count'] });
      queryClient.invalidateQueries({ queryKey: ['user-participation'] });
      
      console.log('[useLeaveRanking] ✅ Cache limpo e queries invalidadas, dados serão atualizados automaticamente');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao sair do ranking: ${error.message}`);
    },
  });

  return { leave, isLeaving };
};
