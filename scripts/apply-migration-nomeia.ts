import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '[cole-aqui-a-service-role-key]';

const supabase = createClient(nomeiaUrl, nomeiaServiceKey);

async function applyMigration() {
  console.log('🚀 Aplicando migration no banco nomeia-ai...');
  console.log('URL:', nomeiaUrl);
  
  try {
    // Ler o arquivo de migration
    const migrationPath = join(process.cwd(), 'supabase/migrations/20250115000012_create_normalized_ranking_structure.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration carregada com sucesso');
    console.log('📊 Tamanho do arquivo:', migrationSQL.length, 'caracteres');
    
    // Executar a migration
    console.log('⚡ Executando migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Erro ao executar migration:', error);
      return false;
    }
    
    console.log('✅ Migration executada com sucesso!');
    console.log('📊 Resultado:', data);
    
    // Verificar se as tabelas foram criadas
    console.log('\n🔍 Verificando tabelas criadas...');
    const tables = ['rankings', 'user_rankings', 'user_answers', 'ranking_answers', 'ranking_disciplines'];
    
    for (const table of tables) {
      const { data: tableData, error: tableError } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (tableError) {
        console.log(`❌ ${table}: ${tableError.message}`);
      } else {
        console.log(`✅ ${table}: ${tableData || 0} registros`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return false;
  }
}

// Executar migration
applyMigration().catch(console.error);
