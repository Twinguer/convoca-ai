export const databaseConfig = {
  // Banco principal (convoca-ai) - PRODUÇÃO
  production: {
    url: 'https://ppsymqrdtjyaguftracc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg3MTA3MiwiZXhwIjoyMDU5NDQ3MDcyfQ.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs',
  },
  
  // Banco de desenvolvimento (nomeia-ai) - RESTAURADO DO DUMP
  development: {
    url: 'https://pbsxnmioktgniyoyqqwb.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBic3hubWlva3Rnbml5b3lxcXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjY3MzcsImV4cCI6MjA3NTk0MjczN30.smoATsi4sPcMsXLPCvE0syGfbdfOG_BYNIenbRUAisM',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBic3hubWlva3Rnbml5b3lxcXdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM2NjczNywiZXhwIjoyMDc1OTQyNzM3fQ.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ',
  }
};

// Detectar ambiente baseado na branch
export const isDevelopment = false; // USAR CONVOCA-AI (PRODUÇÃO)
export const currentDatabase = 'production'; // USAR CONVOCA-AI

// Configuração atual
export const currentConfig = databaseConfig[currentDatabase];
