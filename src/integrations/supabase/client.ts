
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton pattern para evitar múltiplas instâncias
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

// Initialize the Supabase client with direct values
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

// Singleton para cliente principal
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          storage: localStorage,
          autoRefreshToken: true,
          detectSessionInUrl: false
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
  }
  return supabaseInstance;
})();

// Singleton para cliente administrativo (service role key should be set in Supabase secrets for edge functions)
export const supabaseAdmin = supabase; // Use regular client for now, admin operations should be done via edge functions

// Export from other files to maintain backward compatibility
export * from './rankings';
export * from './community';
