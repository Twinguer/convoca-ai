import { createClient } from '@supabase/supabase-js';

console.log('🔍 Verificando credenciais do banco nomeia-ai...');

// Testar diferentes combinações de credenciais
const testCredentials = [
  {
    name: 'Banco Original (Produção)',
    url: 'https://ppsymqrdtjyaguftracc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NzQ4MDAsImV4cCI6MjA1MjE1MDgwMH0.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ'
  },
  {
    name: 'Banco Nomeia-AI (Desenvolvimento)',
    url: 'https://xuovcuefnullpmpktrzd.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg'
  }
];

async function verifyCredentials() {
  for (const cred of testCredentials) {
    console.log(`\n🧪 Testando: ${cred.name}`);
    console.log(`📡 URL: ${cred.url}`);
    console.log(`🔑 Key: ${cred.key.substring(0, 20)}...`);

    try {
      const supabase = createClient(cred.url, cred.key);
      
      // Testar conexão simples
      const { data, error } = await supabase
        .from('rankings')
        .select('id')
        .limit(1);

      if (error) {
        console.log(`❌ Erro: ${error.message}`);
      } else {
        console.log(`✅ Conexão bem-sucedida! Rankings encontrados: ${data?.length || 0}`);
      }
    } catch (err) {
      console.log(`❌ Erro de conexão: ${err}`);
    }
  }
}

verifyCredentials().catch(console.error);
