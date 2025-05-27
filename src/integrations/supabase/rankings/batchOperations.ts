
import { supabase } from '@/integrations/supabase/client';
import { recalculateUserScore } from './rankingMutations';

/**
 * Recalculates scores for all users in a specific concurso
 */
export const recalculateAllUserScores = async (concursoId: string) => {
  try {
    console.log(`[recalculateAllUserScores] Starting batch recalculation for concurso ${concursoId}`);
    
    // Fetch all users participating in this concurso
    const { data, error } = await supabase
      .from('user_rankings')
      .select('id, user_id')
      .eq('concurso_id', concursoId);
      
    if (error) {
      console.error('Error fetching users for batch recalculation:', error);
      return { success: false, error: error.message };
    }
    
    if (!data || data.length === 0) {
      console.log(`[recalculateAllUserScores] No users found for concurso ${concursoId}`);
      return { success: true, updatedCount: 0 };
    }
    
    console.log(`[recalculateAllUserScores] Found ${data.length} users to recalculate`);
    
    // Create an array of promises for all user score recalculations
    const recalculationPromises = data.map(item => 
      recalculateUserScore(item.user_id, concursoId)
    );
    
    // Execute all recalculations in parallel
    const results = await Promise.allSettled(recalculationPromises);
    
    // Count successful updates
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    // Count and gather errors
    const failedResults = results.filter(result => 
      result.status === 'rejected' || 
      (result.status === 'fulfilled' && !result.value.success)
    );
    
    // Log failures if any
    if (failedResults.length > 0) {
      console.error(`[recalculateAllUserScores] ${failedResults.length} score recalculations failed`);
      failedResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed recalculation ${index}:`, result.reason);
        } else if (result.status === 'fulfilled' && !result.value.success) {
          console.error(`Failed recalculation ${index}:`, result.value.error);
        }
      });
    }
    
    console.log(`[recalculateAllUserScores] Successfully recalculated ${successCount} of ${data.length} scores`);
    
    // Insert a log entry for this batch operation
    await supabase
      .from('score_calculation_logs')
      .insert({
        calculation_type: 'batch_recalculation',
        calculation_details: {
          concursoId,
          totalUsers: data.length,
          successCount,
          failedCount: failedResults.length
        }
      });
    
    if (successCount === data.length) {
      return { 
        success: true,
        updatedCount: successCount,
        message: `Successfully recalculated all ${successCount} scores`
      };
    } else {
      return {
        success: true,
        updatedCount: successCount,
        warning: `Successfully recalculated ${successCount} out of ${data.length} scores`,
        failedCount: failedResults.length
      };
    }
    
  } catch (error) {
    console.error('Error in batch recalculation:', error);
    return { success: false, error: String(error) };
  }
};
