
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
// PRIORIDADE: 1. Variáveis de ambiente, 2. Convoca-ai direto, 3. Configuração hardcoded
let supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
let supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Se não encontrar variáveis de ambiente, usar convoca-ai diretamente
if (!supabaseUrl || !supabaseAnonKey) {
  console.log('[Supabase Client] Variáveis de ambiente não encontradas, usando convoca-ai diretamente');
  supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';
} else {
  // Se encontrar variáveis, verificar se é convoca-ai
  if (supabaseUrl.includes('ppsymqrdtjyaguftracc')) {
    console.log('[Supabase Client] Usando convoca-ai via variáveis de ambiente');
  } else {
    console.log('[Supabase Client] Usando banco diferente via variáveis de ambiente');
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
}

// Log de debug para verificar configuração
console.log('[Supabase Client] Configuração:', {
  url: supabaseUrl,
  usingEnvVars: !!(getEnvVar('VITE_SUPABASE_URL') && getEnvVar('VITE_SUPABASE_ANON_KEY')),
  usingConvocaAiDirect: supabaseUrl.includes('ppsymqrdtjyaguftracc'),
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
