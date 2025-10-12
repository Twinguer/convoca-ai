
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with environment variables
// These values will be properly set in the deployment environment
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://xuovcuefnullpmpktrzd.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg',
  {
    auth: {
      persistSession: true,
      storage: localStorage,
      autoRefreshToken: true,
    },
    // Disable schema cache completely to prevent issues with missing or new columns
    global: {
      headers: {
        'X-Supabase-Cache-Control': '0'
      }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Export from other files to maintain backward compatibility
export * from './rankings';
export * from './community';
