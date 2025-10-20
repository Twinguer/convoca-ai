
import { createClient } from '@supabase/supabase-js';
import { currentConfig } from '@/config/database';

// Função para obter variáveis de ambiente de forma segura
function getEnvVar(key: string, defaultValue: string = ''): string {
  if (typeof window !== 'undefined' && (window as any).import?.meta?.env) {
    return (window as any).import.meta.env[key] || defaultValue;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
}

// Initialize the Supabase client with dynamic configuration
// PRIORIDADE: 1. Variáveis de ambiente, 2. Configuração hardcoded
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || currentConfig.url;
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || currentConfig.anonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
}

// Log de debug para verificar configuração
console.log('[Supabase Client] Configuração:', {
  url: supabaseUrl,
  usingEnvVars: !!(getEnvVar('VITE_SUPABASE_URL') && getEnvVar('VITE_SUPABASE_ANON_KEY')),
  usingHardcoded: !getEnvVar('VITE_SUPABASE_URL') || !getEnvVar('VITE_SUPABASE_ANON_KEY')
});

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      storage: localStorage,
      autoRefreshToken: true,
    },
    // Disable all caching to ensure fresh data
    global: {
      headers: {
        'X-Supabase-Cache-Control': '0',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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
const supabaseServiceRoleKey = getEnvVar('VITE_SUPABASE_SERVICE_ROLE_KEY') || currentConfig.serviceRoleKey;

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
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
