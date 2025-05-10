
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with environment variables
// These values will be properly set in the deployment environment
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://ppsymqrdtjyaguftracc.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs',
  {
    auth: {
      persistSession: true,
      storage: localStorage,
      autoRefreshToken: true,
    },
    // Disable schema cache to prevent issues with missing columns
    global: {
      headers: {
        'X-Supabase-Cache-Control': '0'
      }
    }
  }
);

// Export from other files to maintain backward compatibility
export * from './rankings';
export * from './community';
