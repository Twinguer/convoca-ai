import { createClient } from '@supabase/supabase-js';

// Credenciais do banco original
const originalUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const originalAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

async function testOriginalConnection() {
  console.log('🔍 Testando conexão com banco original...');
  console.log('URL:', originalUrl);
  
  try {
    const sourceSupabase = createClient(originalUrl, originalAnonKey);

    // Testar conexão básica
    const { data, error } = await sourceSupabase
      .from('users_profiles')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Erro de conexão:', error.message);
      return false;
    }

    console.log('✅ Conexão com banco original estabelecida!');
    console.log(`📊 Usuários no banco original: ${data || 0}`);
    return true;

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return false;
  }
}

// Executar teste
testOriginalConnection().catch(console.error);
