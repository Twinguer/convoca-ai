
import { supabase } from '../client';
import { calculateRawScores, applyWeightsToScores, saveUserScores } from './scoreCalculation';

// Recalcula as pontuações para todos os usuários em um concurso
export const recalculateAllUserScores = async (concursoId: string) => {
  try {
    console.log(`Recalculando scores para todos os usuários no concurso: ${concursoId}`);
    
    // Chamar diretamente a função RPC do banco de dados com o tipo correto de dado
    const { data, error } = await supabase
      .rpc('recalculate_all_scores', { p_concurso_id: concursoId })
      .single();
    
    if (error) {
      console.error('Erro ao recalcular pontuações:', error);
      throw error;
    }
    
    console.log('Resultado do recálculo:', data);
    
    // Verificar o resultado retornado pela função
    if (!data?.success) {
      return { 
        success: false, 
        error: data?.error || 'Falha ao recalcular pontuações', 
        updatedCount: 0 
      };
    }
    
    return { 
      success: true, 
      updatedCount: data.updatedCount || 0 
    };
  } catch (error: any) {
    console.error('Erro recalculando todas as pontuações de usuários:', error);
    return { success: false, error: error.message };
  }
};
