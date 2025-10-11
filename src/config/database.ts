export const databaseConfig = {
  // Banco principal (produção)
  production: {
    url: import.meta.env.VITE_SUPABASE_URL_ORIGINAL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_ORIGINAL,
    serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY_ORIGINAL,
  },
  
  // Banco de desenvolvimento (nomeia-ai)
  development: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  }
};

// Detectar ambiente baseado na branch
export const isDevelopment = import.meta.env.VITE_BRANCH === 'nomeia-ai';
export const currentDatabase = isDevelopment ? 'development' : 'production';

// Configuração atual
export const currentConfig = databaseConfig[currentDatabase];
