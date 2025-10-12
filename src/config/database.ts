export const databaseConfig = {
  // Banco principal (convoca-ai) - PRODUÇÃO
  production: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://ppsymqrdtjyaguftracc.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs',
    serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'sua-service-role-key-aqui',
  },
  
  // Banco de desenvolvimento (nomeia-ai) - MANTIDO PARA COMPATIBILIDADE
  development: {
    url: import.meta.env.VITE_SUPABASE_URL_ORIGINAL || 'https://xuovcuefnullpmpktrzd.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_ORIGINAL || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg',
    serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY_ORIGINAL || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEzMjI2MywiZXhwIjoyMDc1NzA4MjYzfQ.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ',
  }
};

// Detectar ambiente baseado na branch
export const isDevelopment = false; // USAR CONVOCA-AI (PRODUÇÃO)
export const currentDatabase = 'production'; // USAR CONVOCA-AI

// Configuração atual
export const currentConfig = databaseConfig[currentDatabase];
