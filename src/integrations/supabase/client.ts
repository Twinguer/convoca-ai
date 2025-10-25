
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton pattern para evitar múltiplas instâncias
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

// Initialize the Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
}

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

// Singleton para cliente administrativo
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  return supabaseAdminInstance;
})();

// Export from other files to maintain backward compatibility
export * from './rankings';
export * from './community';
