import { createClient } from '@supabase/supabase-js';

// Lê as credenciais de ambiente - NUNCA usar fallbacks hardcoded em produção
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('✖ Variáveis VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY ausentes.');
  console.error('✖ Configure as variáveis de ambiente antes de executar o script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  try {
    // 1) Teste simples: obter sessão (não requer tabelas)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('✖ Erro ao obter sessão:', sessionError.message);
    } else {
      console.log('✓ getSession OK:', Boolean(sessionData?.session));
    }

    // 2) Teste de acesso ao banco: tenta selecionar de uma tabela comum
    // Ajuste o nome da tabela se necessário (ex.: 'profiles')
    const testTable = process.env.SUPABASE_TEST_TABLE || 'profiles';
    const { data, error } = await supabase.from(testTable).select('*').limit(1);

    if (error) {
      console.error(`✖ Erro ao consultar tabela "${testTable}":`, error.message);
      process.exitCode = 2;
    } else {
      console.log(`✓ Consulta em "${testTable}" OK:`, Array.isArray(data) ? data.length : 0, 'linha(s)');
    }
  } catch (e) {
    console.error('✖ Falha inesperada:', e);
    process.exit(1);
  }
}

main();


