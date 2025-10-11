import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const developmentUrl = process.env.VITE_SUPABASE_URL;
const developmentServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Verificar se as variáveis estão definidas
if (!developmentUrl || !developmentServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('Verifique se o arquivo .env.local está configurado corretamente.');
  console.error('Variáveis necessárias:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const targetSupabase = createClient(developmentUrl, developmentServiceKey);

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
