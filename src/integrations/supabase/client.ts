
import { createClient } from '@supabase/supabase-js';
import { currentConfig } from '@/config/database';

// Initialize the Supabase client with dynamic configuration
// CRITICAL: Never hardcode credentials in production code
const supabaseUrl = currentConfig.url;
const supabaseAnonKey = currentConfig.anonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
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

// Cliente para operações administrativas
export const supabaseAdmin = createClient(
  currentConfig.url,
  currentConfig.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Export from other files to maintain backward compatibility
export * from './rankings';
export * from './community';
