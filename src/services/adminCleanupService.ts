
import { supabase } from '@/integrations/supabase/client';

export const cleanupAllRankings = async () => {
  console.log('Iniciando limpeza de todos os rankings...');
  
  try {
    // 1. Deletar todos os score_calculation_logs PRIMEIRO (devido à foreign key)
    console.log('Deletando score_calculation_logs...');
    const { error: logsError } = await supabase
      .from('score_calculation_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (logsError && logsError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Erro ao deletar score_calculation_logs:', logsError);
    }

    // 2. Deletar todas as user_answers
    console.log('Deletando user_answers...');
    const { error: answersError } = await supabase
      .from('user_answers')
      .delete()
      .neq('id', 0); // Delete all
    
    if (answersError && answersError.code !== 'PGRST116') {
      console.error('Erro ao deletar user_answers:', answersError);
    }

    // 3. Deletar todos os user_rankings
    console.log('Deletando user_rankings...');
    const { error: rankingsError } = await supabase
      .from('user_rankings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (rankingsError && rankingsError.code !== 'PGRST116') {
      console.error('Erro ao deletar user_rankings:', rankingsError);
    }

    // 4. Deletar todos os official_answer_weights
    console.log('Deletando official_answer_weights...');
    const { error: weightsError } = await supabase
      .from('official_answer_weights')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (weightsError && weightsError.code !== 'PGRST116') {
      console.error('Erro ao deletar official_answer_weights:', weightsError);
    }

    // 5. Deletar todos os exam_booklets
    console.log('Deletando exam_booklets...');
    const { error: bookletsError } = await supabase
      .from('exam_booklets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (bookletsError && bookletsError.code !== 'PGRST116') {
      console.error('Erro ao deletar exam_booklets:', bookletsError);
    }

    // 6. Deletar todos os concursos
    console.log('Deletando concursos...');
    const { error: concursosError } = await supabase
      .from('concursos')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (concursosError && concursosError.code !== 'PGRST116') {
      console.error('Erro ao deletar concursos:', concursosError);
      throw concursosError;
    }

    console.log('Limpeza de todos os rankings concluída com sucesso!');
    return { success: true };
  } catch (error) {
    console.error('Erro na limpeza:', error);
    throw error;
  }
};
