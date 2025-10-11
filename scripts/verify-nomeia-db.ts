import { createClient } from '@supabase/supabase-js';
import { databaseConfig } from '../src/config/database';

const targetSupabase = createClient(
  databaseConfig.development.url,
  databaseConfig.development.serviceRoleKey
);

async function verifyNomeiaDatabase() {
  console.log('🔍 Verificando banco nomeia-ai...');
  
  try {
    // Verificar tabelas principais
    const tables = [
      'users_profiles',
      'concursos', 
      'user_rankings',
      'user_answers',
      'official_answer_weights'
    ];
    
    for (const table of tables) {
      const { count, error } = await targetSupabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ Erro ao verificar ${table}:`, error);
      } else {
        console.log(`✅ ${table}: ${count} registros`);
      }
    }
    
    console.log('🎉 Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
    throw error;
  }
}

// Executar verificação
if (import.meta.main) {
  verifyNomeiaDatabase().catch(console.error);
}

export { verifyNomeiaDatabase };
