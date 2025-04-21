
import { supabase } from '../client';
import { calculateRawScores, applyWeightsToScores, saveUserScores } from './scoreCalculation';
import { fetchUserAnswers, fetchSubjectiveScores } from './answerManagement';

/**
 * Recalcula as pontuações para todos os usuários em um concurso
 */
export const recalculateAllUserScores = async (concursoId: string) => {
  try {
    console.log(`Iniciando recálculo de pontuações para concurso: ${concursoId}`);
    
    // Busca todos os rankings de usuários para este concurso
    const { data: userRankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select('id, user_id')
      .eq('concurso_id', concursoId);
      
    if (rankingsError) throw rankingsError;
    
    if (!userRankings || userRankings.length === 0) {
      console.log('Nenhum ranking de usuário encontrado para este concurso');
      return { success: true, updatedCount: 0, message: 'Nenhum participante encontrado' };
    }
    
    console.log(`Encontrados ${userRankings.length} rankings para recalcular`);
    
    // Processa cada ranking de usuário
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    
    for (const ranking of userRankings) {
      try {
        console.log(`Processando ranking ${ranking.id} para usuário ${ranking.user_id}`);
        
        // Busca as respostas do usuário
        const userAnswers = await fetchUserAnswers(ranking.id);
        
        if (!userAnswers || userAnswers.length === 0) {
          console.log(`Nenhuma resposta encontrada para ranking ${ranking.id}, pulando...`);
          skippedCount++;
          continue;
        }
        
        // Calcula as pontuações brutas
        const rawScores = await calculateRawScores(concursoId, userAnswers);
        
        // Busca as pontuações subjetivas
        const subjectiveScores = await fetchSubjectiveScores(ranking.id);
        
        // Aplica os pesos para calcular as pontuações ponderadas
        const weightedScores = await applyWeightsToScores(concursoId, rawScores, subjectiveScores);
        
        // Salva todas as pontuações
        await saveUserScores(ranking.id, rawScores, subjectiveScores, weightedScores);
        
        updatedCount++;
        console.log(`Pontuações recalculadas com sucesso para ranking ${ranking.id}`);
      } catch (error: any) {
        const errorMessage = `Erro ao processar ranking ${ranking.id}: ${error.message}`;
        console.error(errorMessage);
        errors.push(errorMessage);
      }
    }
    
    const summary = `Recálculo concluído: ${updatedCount} atualizados, ${skippedCount} pulados, ${errors.length} erros`;
    console.log(summary);
    
    return { 
      success: true, 
      updatedCount,
      skippedCount,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: summary
    };
  } catch (error: any) {
    console.error('Erro no recálculo em lote:', error);
    return { 
      success: false, 
      error: error.message,
      message: `Falha no recálculo: ${error.message}`
    };
  }
};

/**
 * Recalcula a pontuação para um usuário específico
 */
export const recalculateUserScore = async (rankingId: string, concursoId: string) => {
  try {
    console.log(`Recalculando pontuação para ranking ${rankingId}`);
    
    // Busca as respostas do usuário
    const userAnswers = await fetchUserAnswers(rankingId);
    
    if (!userAnswers || userAnswers.length === 0) {
      throw new Error('Nenhuma resposta encontrada');
    }
    
    // Calcula as pontuações brutas
    const rawScores = await calculateRawScores(concursoId, userAnswers);
    
    // Busca as pontuações subjetivas
    const subjectiveScores = await fetchSubjectiveScores(rankingId);
    
    // Aplica os pesos para calcular as pontuações ponderadas
    const weightedScores = await applyWeightsToScores(concursoId, rawScores, subjectiveScores);
    
    // Salva todas as pontuações
    await saveUserScores(rankingId, rawScores, subjectiveScores, weightedScores);
    
    console.log(`Pontuação recalculada com sucesso para ranking ${rankingId}`);
    return { success: true, scores: weightedScores };
  } catch (error: any) {
    console.error('Erro no recálculo individual:', error);
    return { success: false, error: error.message };
  }
};
