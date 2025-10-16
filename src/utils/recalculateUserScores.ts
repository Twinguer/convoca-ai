import { supabase } from '@/integrations/supabase/client';
import { recalculateUserScore } from '@/integrations/supabase/rankings/rankingMutations';

export const recalculateAllUserScores = async (concursoId: string) => {
  try {
    console.log(`[recalculateAllUserScores] Iniciando recálculo para concurso: ${concursoId}`);
    
    // Buscar todos os usuários que participam deste concurso
    const { data: userRankings, error: userRankingsError } = await supabase
      .from('user_rankings')
      .select('user_id, consolidated_data')
      .not('consolidated_data', 'is', null);

    if (userRankingsError) {
      console.error('Erro ao buscar user_rankings:', userRankingsError);
      return;
    }

    console.log(`[recalculateAllUserScores] Encontrados ${userRankings.length} usuários`);

    // Filtrar usuários que participam do concurso específico
    const usersInConcurso = userRankings.filter(userRanking => {
      const rankings = userRanking.consolidated_data?.rankings || {};
      return Object.values(rankings).some((ranking: any) => ranking.concurso_id === concursoId);
    });

    console.log(`[recalculateAllUserScores] ${usersInConcurso.length} usuários participam do concurso ${concursoId}`);

    // Executar recálculo para cada usuário
    for (const userRanking of usersInConcurso) {
      try {
        console.log(`[recalculateAllUserScores] Recalculando para usuário: ${userRanking.user_id}`);
        
        const result = await recalculateUserScore(userRanking.user_id, concursoId);
        
        if (result.success) {
          console.log(`[recalculateAllUserScores] ✅ Sucesso para usuário ${userRanking.user_id}`);
        } else {
          console.error(`[recalculateAllUserScores] ❌ Erro para usuário ${userRanking.user_id}:`, result.message);
        }
      } catch (error) {
        console.error(`[recalculateAllUserScores] ❌ Erro ao recalcular usuário ${userRanking.user_id}:`, error);
      }
    }

    console.log(`[recalculateAllUserScores] Recálculo concluído para concurso ${concursoId}`);
  } catch (error) {
    console.error('[recalculateAllUserScores] Erro geral:', error);
  }
};

export const recalculateSpecificUserScore = async (userId: string, concursoId: string) => {
  try {
    console.log(`[recalculateSpecificUserScore] 🚀 INICIANDO recálculo específico para usuário ${userId} no concurso ${concursoId}`);
    
    console.log(`[recalculateSpecificUserScore] 🔍 Chamando recalculateUserScore...`);
    const result = await recalculateUserScore(userId, concursoId);
    console.log(`[recalculateSpecificUserScore] 📊 Resultado do recalculateUserScore:`, result);
    
    if (result.success) {
      console.log(`[recalculateSpecificUserScore] ✅ Sucesso para usuário ${userId}`);
      return result;
    } else {
      console.error(`[recalculateSpecificUserScore] ❌ Erro para usuário ${userId}:`, result.message);
      return result;
    }
  } catch (error) {
    console.error(`[recalculateSpecificUserScore] ❌ Erro ao recalcular usuário ${userId}:`, error);
    console.error(`[recalculateSpecificUserScore] ❌ Stack trace:`, error.stack);
    return { success: false, message: error.message };
  }
};
