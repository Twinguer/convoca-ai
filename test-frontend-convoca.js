import { createClient } from '@supabase/supabase-js';

// Simular o comportamento do frontend
function getEnvVar(key, defaultValue = '') {
  // Simular import.meta.env do Vite
  const mockEnv = {
    VITE_SUPABASE_URL: 'https://ppsymqrdtjyaguftracc.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs'
  };
  
  if (typeof window !== 'undefined' && window.import?.meta?.env) {
    return window.import.meta.env[key] || defaultValue;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return mockEnv[key] || defaultValue;
}

// Simular a lógica do client.ts
console.log('🔧 Simulando configuração do frontend...');

let supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
let supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

console.log('Variáveis de ambiente detectadas:');
console.log('  VITE_SUPABASE_URL:', supabaseUrl ? '✅ Encontrada' : '❌ Não encontrada');
console.log('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Encontrada' : '❌ Não encontrada');

// Se não encontrar variáveis de ambiente, usar convoca-ai diretamente
if (!supabaseUrl || !supabaseAnonKey) {
  console.log('[Supabase Client] Variáveis de ambiente não encontradas, usando convoca-ai diretamente');
  supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';
} else {
  // Se encontrar variáveis, verificar se é convoca-ai
  if (supabaseUrl.includes('ppsymqrdtjyaguftracc')) {
    console.log('[Supabase Client] Usando convoca-ai via variáveis de ambiente');
  } else {
    console.log('[Supabase Client] Usando banco diferente via variáveis de ambiente');
  }
}

console.log('\n[Supabase Client] Configuração final:', {
  url: supabaseUrl,
  usingEnvVars: !!(getEnvVar('VITE_SUPABASE_URL') && getEnvVar('VITE_SUPABASE_ANON_KEY')),
  usingConvocaAiDirect: supabaseUrl.includes('ppsymqrdtjyaguftracc'),
  usingHardcoded: !getEnvVar('VITE_SUPABASE_URL') || !getEnvVar('VITE_SUPABASE_ANON_KEY')
});

// Testar conexão
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('\n🔗 Testando conexão do frontend...');
  
  try {
    // Teste 1: Verificar concursos
    const { data: concursos, error: concursosError } = await supabase
      .from('concursos')
      .select('id')
      .limit(1);
    
    if (concursosError) {
      console.log('❌ Erro ao conectar:', concursosError.message);
    } else {
      console.log('✅ Frontend conectado ao convoca-ai!');
      console.log('   Concursos encontrados:', concursos?.length || 0);
    }
    
    // Teste 2: Verificar usuários
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profiles')
      .select('id, name')
      .limit(3);
    
    if (profilesError) {
      console.log('❌ Erro ao buscar usuários:', profilesError.message);
    } else {
      console.log('✅ Usuários encontrados:', profiles?.length || 0);
      profiles?.forEach(profile => {
        console.log(`   - ${profile.name}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Erro geral na conexão:', error.message);
  }
}

testConnection().catch(console.error);
