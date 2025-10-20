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

// Detectar ambiente baseado em variáveis de ambiente
const viteBranch = getEnvVar('VITE_BRANCH', '');
const viteDevMode = getEnvVar('VITE_DEV_MODE', 'false');
const nodeEnv = getEnvVar('NODE_ENV', 'development');

// FORÇAR USO DO CONVOCA-AI (PRODUÇÃO)
// Detectar se é desenvolvimento baseado em múltiplos indicadores
export const isDevelopment = viteDevMode === 'true' || 
                            viteBranch === 'nomeia-ai';
                            // Removido: nodeEnv === 'development' para forçar convoca-ai

export const currentDatabase = isDevelopment ? 'development' : 'production';

export const databaseConfig = {
  // Banco principal (convoca-ai) - PRODUÇÃO
  production: {
    url: 'https://ppsymqrdtjyaguftracc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg3MTA3MiwiZXhwIjoyMDU5NDQ3MDcyfQ.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs',
  },
  
  // Banco de desenvolvimento (nomeia-ai) - URL CORRIGIDA
  development: {
    url: 'https://lyoltawveamfpsmxclyb.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBic3hubWlva3Rnbml5b3lxcXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjY3MzcsImV4cCI6MjA3NTk0MjczN30.smoATsi4sPcMsXLPCvE0syGfbdfOG_BYNIenbRUAisM',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBic3hubWlva3Rnbml5b3lxcXdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM2NjczNywiZXhwIjoyMDc1OTQyNzM3fQ.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ',
  }
};

// Configuração atual baseada na detecção automática
export const currentConfig = databaseConfig[currentDatabase];

// Log de debug para verificar configuração
console.log('[Database Config] Ambiente detectado:', {
  isDevelopment,
  currentDatabase,
  viteBranch,
  viteDevMode,
  nodeEnv,
  supabaseUrl: currentConfig.url
});
