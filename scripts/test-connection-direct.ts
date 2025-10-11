import { createClient } from '@supabase/supabase-js';

// Credenciais diretas do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

async function testNomeiaConnection() {
  console.log('🔍 Testando conexão com banco nomeia-ai...');
  console.log('URL:', nomeiaUrl);
  
  try {
    const targetSupabase = createClient(nomeiaUrl, nomeiaAnonKey);

    // Testar conexão básica
    const { data, error } = await targetSupabase
      .from('users_profiles')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Erro de conexão:', error.message);
      return false;
    }

    console.log('✅ Conexão com banco nomeia-ai estabelecida!');
    console.log(`📊 Usuários no banco: ${data || 0}`);
    return true;

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return false;
  }
}

// Executar teste
testNomeiaConnection().catch(console.error);
