
import { supabase } from '@/integrations/supabase/client';

export const recalculateScores = async (concursoId: string) => {
  try {
    const { data, error } = await supabase.rpc('recalculate_all_scores_improved', {
      p_concurso_id: concursoId
    });

    if (error) throw error;

    console.log('Score recalculation result:', data);
    return data;
  } catch (error) {
    console.error('Error recalculating scores:', error);
    throw error;
  }
};

export const getCalculationProgress = async (concursoId: string) => {
  try {
    const { data, error } = await supabase
      .from('score_calculation_logs')
      .select('calculation_type, calculation_details')
      .eq('calculation_type', 'improved_batch_recalculate_progress')
      .eq('calculation_details->concurso_id', concursoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.calculation_details?.processed_count || 0;
  } catch (error) {
    console.error('Error getting calculation progress:', error);
    return 0;
  }
};
