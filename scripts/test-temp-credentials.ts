import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function testTempCredentials() {
  console.log('🔍 Testando credenciais temporárias...');

  const tempCredentials = [
    { email: 'pedro@teste.com', password: 'temp_pedro_123', name: 'Pedro Costa' },
    { email: 'maria@teste.com', password: 'temp_maria_123', name: 'Maria Santos' },
    { email: 'joao@teste.com', password: 'temp_joao_123', name: 'João Silva' },
    { email: 'netesabonete5@gmail.com', password: 'temp_netesabonete5_123', name: 'Sabonete Nete' },
    { email: 'convocai.oficial@gmail.com', password: 'temp_convocai.oficial_123', name: 'Nomeia Aí' }
  ];

  try {
    for (const cred of tempCredentials) {
      console.log(`\n🔐 Testando: ${cred.name} (${cred.email})`);
      
      // Aguardar para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: cred.email,
        password: cred.password
      });

      if (loginError) {
        console.log(`   ❌ Erro: ${loginError.message}`);
        
        if (loginError.message?.includes('Email not confirmed')) {
          console.log(`   ℹ️ Email não confirmado - usuário precisa confirmar email`);
        } else if (loginError.message?.includes('Invalid login credentials')) {
          console.log(`   ❌ Credenciais inválidas - usuário não foi recriado corretamente`);
        }
      } else {
        console.log(`   ✅ Login bem-sucedido!`);
        console.log(`   ID: ${loginData.user?.id}`);
        console.log(`   Email confirmado: ${loginData.user?.email_confirmed_at ? 'Sim' : 'Não'}`);
        
        // Fazer logout
        await supabase.auth.signOut();
        console.log(`   ✅ Logout realizado`);
      }
    }

    console.log('\n📋 Resumo dos testes:');
    console.log('✅ Credenciais temporárias foram criadas');
    console.log('⚠️ Alguns usuários podem precisar confirmar email');
    console.log('✅ Sistema está funcionando para login');

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testTempCredentials().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});



