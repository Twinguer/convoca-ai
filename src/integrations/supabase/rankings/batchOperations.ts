
import { supabase } from '@/integrations/supabase/client';

/**
 * Recalculates scores for all users in a specific concurso
 * This function now uses a Supabase RPC with SECURITY DEFINER to bypass authentication requirements
 */
export const recalculateAllUserScores = async (concursoId: string) => {
  try {
    console.log(`[recalculateAllUserScores] Starting batch recalculation for concurso ${concursoId}`);
    
    // Use RPC function with SECURITY DEFINER to bypass RLS policies
    const { data, error } = await supabase.rpc('recalculate_all_scores_with_weights', {
      p_concurso_id: concursoId
    });
    
    if (error) {
      console.error('Error in batch recalculation RPC:', error);
      return { success: false, error: error.message };
    }
    
    if (!data) {
      console.log(`[recalculateAllUserScores] No data returned from RPC for concurso ${concursoId}`);
      return { success: true, updatedCount: 0 };
    }
    
    console.log(`[recalculateAllUserScores] RPC completed:`, data);
    
    // The RPC should return a JSONB object with success, updatedCount, etc.
    if (data.success) {
      return {
        success: true,
        updatedCount: data.updatedCount || 0,
        message: `Successfully recalculated scores for ${data.updatedCount || 0} users`
      };
    } else {
      return {
        success: false,
        error: data.error || 'Unknown error in RPC execution'
      };
    }
    
  } catch (error) {
    console.error('Error in batch recalculation:', error);
    return { success: false, error: String(error) };
  }
};
