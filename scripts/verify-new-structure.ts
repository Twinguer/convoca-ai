import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function verifyNewStructure() {
  console.log('🔍 Verificando nova estrutura normalizada...');
  
  const tables = [
    'rankings',
    'user_rankings', 
    'user_answers',
    'ranking_answers',
    'ranking_disciplines',
    'users_profiles'
  ];
  
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`✅ ${table}: ${data || 0} registros`);
      }
    } catch (err) {
      console.log(`❌ ${table}: Erro inesperado - ${err}`);
      allTablesExist = false;
    }
  }
  
  if (allTablesExist) {
    console.log('\n🎉 Nova estrutura criada com sucesso!');
    console.log('📊 Todas as 6 tabelas estão funcionando');
    console.log('🚀 Pronto para implementar a Fase 2 (Migração de Dados)');
  } else {
    console.log('\n⚠️ Algumas tabelas não foram criadas corretamente');
    console.log('🔧 Verifique os erros acima e execute a migration novamente');
  }
  
  return allTablesExist;
}

// Executar verificação
verifyNewStructure().catch(console.error);
