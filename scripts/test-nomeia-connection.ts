import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Configuração direta para evitar problemas com import.meta.env
const nomeiaUrl = process.env.VITE_SUPABASE_URL;
const nomeiaAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function testNomeiaConnection() {
  console.log('🔍 Testando conexão com banco nomeia-ai...');
  
  if (!nomeiaUrl || !nomeiaAnonKey) {
    console.error('❌ Variáveis de ambiente não encontradas!');
    console.error('Verifique se o arquivo .env.local está configurado corretamente.');
    console.error('Variáveis necessárias:');
    console.error('- VITE_SUPABASE_URL');
    console.error('- VITE_SUPABASE_ANON_KEY');
    return false;
  }

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
if (import.meta.main) {
  testNomeiaConnection().catch(console.error);
}

export { testNomeiaConnection };
