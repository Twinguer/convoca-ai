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

async function createConfirmedUsers() {
  console.log('👤 Criando usuários confirmados para teste...');

  const testUsers = [
    { email: 'admin@teste.com', password: 'admin123', name: 'Admin Teste' },
    { email: 'user@teste.com', password: 'user123', name: 'User Teste' },
    { email: 'demo@teste.com', password: 'demo123', name: 'Demo Teste' }
  ];

  try {
    for (const user of testUsers) {
      console.log(`\n🔑 Criando: ${user.name} (${user.email})`);
      
      // Aguardar para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Criar usuário
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            name: user.name
          }
        }
      });

      if (signupError) {
        if (signupError.message?.includes('User already registered')) {
          console.log(`   ⚠️ Usuário já existe: ${user.email}`);
          
          // Tentar fazer login para verificar se funciona
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: user.password
          });

          if (loginError) {
            console.log(`   ❌ Login falhou: ${loginError.message}`);
          } else {
            console.log(`   ✅ Login funcionou!`);
            await supabase.auth.signOut();
          }
        } else {
          console.log(`   ❌ Erro ao criar: ${signupError.message}`);
        }
      } else {
        console.log(`   ✅ Usuário criado: ${signupData.user?.id}`);
        
        // Criar perfil
        const { error: profileError } = await supabase
          .from('users_profiles')
          .insert({
            id: signupData.user?.id,
            email: user.email,
            name: user.name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.log(`   ⚠️ Erro ao criar perfil: ${profileError.message}`);
        } else {
          console.log(`   ✅ Perfil criado`);
        }

        // Verificar se o email foi confirmado automaticamente
        if (signupData.user?.email_confirmed_at) {
          console.log(`   ✅ Email confirmado automaticamente`);
        } else {
          console.log(`   ⚠️ Email não confirmado - tentando confirmar...`);
          
          // Tentar confirmar email
          const { error: confirmError } = await supabase.auth.resend({
            type: 'signup',
            email: user.email
          });
          
          if (confirmError) {
            console.log(`   ❌ Erro ao confirmar: ${confirmError.message}`);
          } else {
            console.log(`   ✅ Email de confirmação enviado`);
          }
        }
      }
    }

    // Criar usuário com confirmação manual via SQL (se possível)
    console.log('\n🔧 Tentando criar usuário com confirmação manual...');
    const manualUser = {
      email: 'manual@teste.com',
      password: 'manual123',
      name: 'Manual Teste'
    };

    const { data: manualSignupData, error: manualSignupError } = await supabase.auth.signUp({
      email: manualUser.email,
      password: manualUser.password,
      options: {
        data: {
          name: manualUser.name
        }
      }
    });

    if (manualSignupError) {
      console.log(`❌ Erro ao criar usuário manual: ${manualSignupError.message}`);
    } else {
      console.log(`✅ Usuário manual criado: ${manualSignupData.user?.id}`);
      
      // Criar perfil
      const { error: manualProfileError } = await supabase
        .from('users_profiles')
        .insert({
          id: manualSignupData.user?.id,
          email: manualUser.email,
          name: manualUser.name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (manualProfileError) {
        console.log(`⚠️ Erro ao criar perfil manual: ${manualProfileError.message}`);
      } else {
        console.log(`✅ Perfil manual criado`);
      }
    }

    // Resumo das credenciais
    console.log('\n📋 Credenciais de teste disponíveis:');
    console.log('=' .repeat(50));
    console.log('admin@teste.com | admin123');
    console.log('user@teste.com | user123');
    console.log('demo@teste.com | demo123');
    console.log('manual@teste.com | manual123');
    console.log('=' .repeat(50));

    console.log('\n⚠️ Nota importante:');
    console.log('Se o login não funcionar, pode ser necessário:');
    console.log('1. Confirmar o email manualmente no Supabase');
    console.log('2. Ou desabilitar a confirmação de email no projeto');
    console.log('3. Ou usar um email real para receber a confirmação');

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar criação
createConfirmedUsers().then(() => {
  console.log('\n🏁 Criação concluída');
  console.log('\n🌐 Acesse: http://localhost:8084');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});



