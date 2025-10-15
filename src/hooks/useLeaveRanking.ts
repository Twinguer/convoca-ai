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

      // Remover ranking do JSON consolidado do usuário
      const { data: userRankingData, error: consolidatedError } = await supabase
        .from('user_rankings')
        .select('consolidated_data')
        .eq('user_id', user.id)
        .single();

      if (consolidatedError && consolidatedError.code !== 'PGRST116') {
        console.error('Error fetching user ranking data:', consolidatedError);
      }

      if (userRankingData?.consolidated_data) {
        const updatedData = { ...userRankingData.consolidated_data };
        if (updatedData.rankings && updatedData.rankings[rankingId]) {
          delete updatedData.rankings[rankingId];

          await supabase
            .from('user_rankings')
            .update({ consolidated_data: updatedData })
            .eq('user_id', user.id);
        }
      }

      // Deletar registros relacionados
      await supabase.from('score_calculation_logs').delete().eq('user_ranking_id', rankingId);
      // user_answers não é mais usado - dados estão em user_rankings consolidated_data
      
      const { error: deleteError } = await supabase
        .from('user_rankings')
        .delete()
        .eq('id', rankingId);

      if (deleteError) throw deleteError;

      return { success: true };
    },
    onSuccess: (data, concursoId) => {
      // console.log('[useLeaveRanking] 🎉 Usuário saiu do ranking com sucesso, invalidando queries...');
      toast.success('Você saiu do ranking com sucesso');
      
      // Limpar cache local para forçar busca de dados frescos
      // console.log('[useLeaveRanking] 🗑️ Limpando cache local...');
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
      
      // console.log('[useLeaveRanking] ✅ Cache limpo e queries invalidadas, dados serão atualizados automaticamente');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao sair do ranking: ${error.message}`);
    },
  });

  return { leave, isLeaving };
};
