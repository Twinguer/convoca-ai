import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const targetSupabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function checkTables() {
  console.log('🔍 Verificando tabelas no banco nomeia-ai...');
  
  const tables = [
    'users_profiles',
    'concursos',
    'user_rankings',
    'user_answers',
    'official_answer_weights'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await targetSupabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${data || 0} registros`);
      }
    } catch (err) {
      console.log(`❌ ${table}: Erro inesperado - ${err}`);
    }
  }
}

// Executar verificação
checkTables().catch(console.error);
