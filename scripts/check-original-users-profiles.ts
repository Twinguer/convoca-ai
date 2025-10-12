import { createClient } from '@supabase/supabase-js';

// Credenciais do banco original (fonte)
const originalUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const originalAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const sourceSupabase = createClient(originalUrl, originalAnonKey);

async function checkOriginalUsersProfiles() {
  console.log('🔍 Verificando estrutura da tabela users_profiles no banco original...');
  
  try {
    // 1. Buscar alguns registros para ver a estrutura
    const { data: users, error: usersError } = await sourceSupabase
      .from('users_profiles')
      .select('*')
      .limit(3);
    
    if (usersError) {
      console.error('❌ Erro ao buscar users_profiles:', usersError.message);
      return;
    }
    
    if (users && users.length > 0) {
      console.log('✅ Estrutura da tabela users_profiles:');
      console.log('='.repeat(60));
      
      const firstUser = users[0];
      Object.keys(firstUser).forEach(key => {
        const value = firstUser[key];
        const type = typeof value;
        console.log(`  - ${key}: ${type} (${value})`);
      });
      
      console.log('='.repeat(60));
      console.log(`📊 Total de registros encontrados: ${users.length}`);
      
      // 2. Verificar se há dados
      const { count, error: countError } = await sourceSupabase
        .from('users_profiles')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('❌ Erro ao contar users_profiles:', countError.message);
      } else {
        console.log(`📊 Total de registros na tabela: ${count || 0}`);
      }
      
    } else {
      console.log('ℹ️ Nenhum registro encontrado na tabela users_profiles');
    }
    
    // 3. Verificar outras tabelas também
    console.log('\n🔍 Verificando outras tabelas...');
    
    const tables = ['concursos', 'user_rankings', 'user_answers', 'official_answer_weights'];
    
    for (const table of tables) {
      const { count, error } = await sourceSupabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ Erro ao verificar ${table}:`, error.message);
      } else {
        console.log(`✅ ${table}: ${count || 0} registros`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar verificação
checkOriginalUsersProfiles().catch(console.error);

