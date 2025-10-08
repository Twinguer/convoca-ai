import { createClient } from '@supabase/supabase-js';

// Lê as credenciais de ambiente ou usa os fallbacks do projeto
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ppsymqrdtjyaguftracc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('✖ Variáveis VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY ausentes e sem fallback.');
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


