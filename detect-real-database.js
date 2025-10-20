import { createClient } from '@supabase/supabase-js';

// Simular exatamente o que o frontend faz
function getEnvVar(key, defaultValue = '') {
  // Simular import.meta.env do Vite
  const mockEnv = {
    VITE_SUPABASE_URL: 'https://ppsymqrdtjyaguftracc.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs'
  };
  
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return mockEnv[key] || defaultValue;
}

// Simular a lógica do database.ts
const viteBranch = getEnvVar('VITE_BRANCH', '');
const viteDevMode = getEnvVar('VITE_DEV_MODE', 'false');
const nodeEnv = getEnvVar('NODE_ENV', 'development');

const isDevelopment = viteDevMode === 'true' || 
                    viteBranch === 'nomeia-ai';
                    // Removido: nodeEnv === 'development' para forçar convoca-ai

const currentDatabase = isDevelopment ? 'development' : 'production';

console.log('🔍 DETECTANDO BANCO REAL:');
console.log('  VITE_BRANCH:', viteBranch);
console.log('  VITE_DEV_MODE:', viteDevMode);
console.log('  NODE_ENV:', nodeEnv);
console.log('  isDevelopment:', isDevelopment);
console.log('  currentDatabase:', currentDatabase);

// Configurações dos bancos
const databaseConfig = {
  production: {
    url: 'https://ppsymqrdtjyaguftracc.supabase.co',
    name: 'CONVOCA-AI',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs'
  },
  development: {
    url: 'https://lyoltawveamfpsmxclyb.supabase.co',
    name: 'NOMEIA-AI',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBic3hubWlva3Rnbml5b3lxcXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjY3MzcsImV4cCI6MjA3NTk0MjczN30.smoATsi4sPcMsXLPCvE0syGfbdfOG_BYNIenbRUAisM'
  }
};

const currentConfig = databaseConfig[currentDatabase];
console.log('  BANCO ATIVO:', currentConfig.name);
console.log('  URL:', currentConfig.url);

// Testar conexão real
const supabase = createClient(currentConfig.url, currentConfig.anonKey);

async function testRealConnection() {
  console.log('\n🔗 Testando conexão real...');
  
  try {
    // Teste 1: Contar usuários
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profiles')
      .select('id, name, email')
      .limit(20);
    
    if (profilesError) {
      console.log('❌ Erro ao buscar usuários:', profilesError.message);
    } else {
      console.log(`✅ Usuários encontrados: ${profiles?.length || 0}`);
      if (profiles && profiles.length > 0) {
        console.log('   Primeiros usuários:');
        profiles.slice(0, 5).forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.name} (${profile.email})`);
        });
      }
    }
    
    // Teste 2: Contar concursos
    const { data: concursos, error: concursosError } = await supabase
      .from('concursos')
      .select('id')
      .limit(10);
    
    if (concursosError) {
      console.log('❌ Erro ao buscar concursos:', concursosError.message);
    } else {
      console.log(`✅ Concursos encontrados: ${concursos?.length || 0}`);
    }
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log(`   Banco ativo: ${currentConfig.name}`);
    console.log(`   URL: ${currentConfig.url}`);
    console.log(`   Usuários: ${profiles?.length || 0}`);
    console.log(`   Concursos: ${concursos?.length || 0}`);
    
  } catch (err) {
    console.log('❌ Erro geral na conexão:', err.message);
  }
}

testRealConnection().catch(console.error);
