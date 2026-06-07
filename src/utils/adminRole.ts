import { supabase } from '@/integrations/supabase/client';
import { devLog } from '@/utils/productionLogger';

export async function checkIsPlatformAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (error) {
      devLog.error('checkIsPlatformAdmin failed', error);
      return false;
    }

    return !!data;
  } catch (error) {
    devLog.error('checkIsPlatformAdmin failed', error);
    return false;
  }
}
