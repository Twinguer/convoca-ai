import { createClient } from '@supabase/supabase-js';

const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

// Testar diferentes chaves de serviço
const serviceKeys = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEzMjI2MywiZXhwIjoyMDc1NzA4MjYzfQ.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEzMjI2MywiZXhwIjoyMDc1NzA4MjYzfQ.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEzMjI2MywiZXhwIjoyMDc1NzA4MjYzfQ.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ'
];

async function testServiceKeys() {
  console.log('🔍 Testando chaves de serviço para banco nomeia-ai...');

  for (let i = 0; i < serviceKeys.length; i++) {
    const serviceKey = serviceKeys[i];
    console.log(`\n🧪 Testando chave ${i + 1}...`);
    console.log(`🔑 Key: ${serviceKey.substring(0, 20)}...`);

    try {
      const supabaseAdmin = createClient(nomeiaUrl, serviceKey);
      
      // Testar inserção simples
      const { data, error } = await supabaseAdmin
        .from('rankings')
        .select('id')
        .limit(1);

      if (error) {
        console.log(`❌ Erro com chave ${i + 1}: ${error.message}`);
      } else {
        console.log(`✅ Chave ${i + 1} funcionou! Rankings encontrados: ${data?.length || 0}`);
        break;
      }
    } catch (err) {
      console.log(`❌ Erro com chave ${i + 1}: ${err}`);
    }
  }
}

testServiceKeys().catch(console.error);



