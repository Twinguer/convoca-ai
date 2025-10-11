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

async function cleanupNomeiaDatabase() {
  console.log('🧹 Limpando banco nomeia-ai...');
  
  try {
    // Limpar todas as tabelas na ordem correta (respeitando foreign keys)
    await targetSupabase.from('user_answers').delete().neq('id', '');
    console.log('✅ user_answers limpo');
    
    await targetSupabase.from('user_rankings').delete().neq('id', '');
    console.log('✅ user_rankings limpo');
    
    await targetSupabase.from('official_answer_weights').delete().neq('id', '');
    console.log('✅ official_answer_weights limpo');
    
    await targetSupabase.from('concursos').delete().neq('id', '');
    console.log('✅ concursos limpo');
    
    await targetSupabase.from('users_profiles').delete().neq('id', '');
    console.log('✅ users_profiles limpo');
    
    console.log('🎉 Banco nomeia-ai limpo com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    throw error;
  }
}

// Executar limpeza
if (import.meta.main) {
  cleanupNomeiaDatabase().catch(console.error);
}

export { cleanupNomeiaDatabase };
