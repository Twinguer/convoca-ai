import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StudySchedule } from '@/types/userStudy';

/**
 * Optimized hook for fetching schedule sessions using RPC function
 * @param userId - User ID
 * @param cycleId - Optional cycle ID filter
 * @param dayOfWeek - Optional day of week filter
 */
export function useScheduleSessions(
  userId: string | undefined,
  cycleId?: string,
  dayOfWeek?: number
) {
  return useQuery({
    queryKey: ['schedule-sessions', userId, cycleId, dayOfWeek],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase.rpc('get_schedule_sessions', {
        p_user_id: userId,
        p_cycle_id: cycleId || null,
        p_day_of_week: dayOfWeek ?? null
      });
      
      if (error) {
        console.error('Error fetching schedule sessions:', error);
        throw error;
      }
      
      // Map RPC result to StudySchedule interface
      return (data || []).map((row: any) => ({
        id: row.session_id,
        schedule_session_id: row.schedule_session_id,
        cycle_id: row.cycle_id,
        day_of_week: row.day_of_week,
        start_time: row.start_time,
        end_time: row.end_time,
        discipline_name: row.discipline_name,
        block_name: row.block_name,
        session_link: row.session_link,
        study_plan_id: row.study_plan_id,
        subject_id: row.subject_id,
        total_stats: row.total_stats,
        created_at: row.created_at,
        updated_at: row.updated_at
      })) as StudySchedule[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10 // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook for fetching schedule grouped by day of week
 * @param userId - User ID
 * @param cycleId - Optional cycle ID filter
 */
export function useScheduleByWeek(
  userId: string | undefined,
  cycleId?: string
) {
  return useQuery({
    queryKey: ['schedule-by-week', userId, cycleId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase.rpc('get_schedule_by_week', {
        p_user_id: userId,
        p_cycle_id: cycleId || null
      });
      
      if (error) {
        console.error('Error fetching schedule by week:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5
  });
}
