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

async function testLoginCredentials() {
  console.log('🔐 Testando credenciais de login...');

  const testCredentials = [
    { email: 'pedro@teste.com', password: 'temp_pedro_123', name: 'Pedro Costa' },
    { email: 'maria@teste.com', password: 'temp_maria_123', name: 'Maria Santos' },
    { email: 'joao@teste.com', password: 'temp_joao_123', name: 'João Silva' },
    { email: 'netesabonete5@gmail.com', password: 'temp_netesabonete5_123', name: 'Sabonete Nete' },
    { email: 'convocai.oficial@gmail.com', password: 'temp_convocai.oficial_123', name: 'Nomeia Aí' }
  ];

  try {
    console.log('\n1. Testando credenciais individuais...');
    
    for (const cred of testCredentials) {
      console.log(`\n🔑 Testando: ${cred.name} (${cred.email})`);
      
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
          
          // Tentar confirmar email automaticamente
          console.log(`   🔄 Tentando confirmar email...`);
          const { data: confirmData, error: confirmError } = await supabase.auth.resend({
            type: 'signup',
            email: cred.email
          });
          
          if (confirmError) {
            console.log(`   ❌ Erro ao reenviar confirmação: ${confirmError.message}`);
          } else {
            console.log(`   ✅ Email de confirmação reenviado`);
          }
        } else if (loginError.message?.includes('Invalid login credentials')) {
          console.log(`   ❌ Credenciais inválidas - usuário pode não existir`);
          
          // Verificar se o usuário existe na tabela auth.users
          console.log(`   🔍 Verificando se usuário existe...`);
          const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: cred.email,
            password: cred.password,
            options: {
              data: {
                name: cred.name
              }
            }
          });
          
          if (signupError) {
            if (signupError.message?.includes('User already registered')) {
              console.log(`   ⚠️ Usuário existe mas senha pode estar incorreta`);
            } else {
              console.log(`   ❌ Erro ao recriar usuário: ${signupError.message}`);
            }
          } else {
            console.log(`   ✅ Usuário recriado com sucesso!`);
          }
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

    // Teste 2: Verificar se há usuários na tabela auth.users
    console.log('\n2. Verificando usuários na base de dados...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('users_profiles')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (profilesError) {
      console.log('❌ Erro ao buscar perfis:', profilesError.message);
    } else {
      console.log('✅ Perfis encontrados:', profilesData?.length || 0);
      if (profilesData && profilesData.length > 0) {
        console.log('\n📋 Usuários disponíveis:');
        profilesData.forEach((profile, index) => {
          console.log(`${index + 1}. ${profile.name} (${profile.email})`);
        });
      }
    }

    // Teste 3: Criar um usuário de teste funcional
    console.log('\n3. Criando usuário de teste funcional...');
    const testEmail = `teste-funcional-${Date.now()}@exemplo.com`;
    const testPassword = 'senha123456';
    const testName = 'Teste Funcional';

    const { data: newUserData, error: newUserError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: testName
        }
      }
    });

    if (newUserError) {
      console.log('❌ Erro ao criar usuário de teste:', newUserError.message);
    } else {
      console.log('✅ Usuário de teste criado!');
      console.log('Email:', testEmail);
      console.log('Senha:', testPassword);
      console.log('ID:', newUserData.user?.id);
      
      // Criar perfil manualmente
      const { error: profileError } = await supabase
        .from('users_profiles')
        .insert({
          id: newUserData.user?.id,
          email: testEmail,
          name: testName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.log('⚠️ Erro ao criar perfil:', profileError.message);
      } else {
        console.log('✅ Perfil criado com sucesso!');
      }

      // Testar login
      console.log('\n4. Testando login do usuário de teste...');
      const { data: testLoginData, error: testLoginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (testLoginError) {
        console.log('❌ Erro no login de teste:', testLoginError.message);
      } else {
        console.log('✅ Login de teste bem-sucedido!');
        console.log('Email confirmado:', testLoginData.user?.email_confirmed_at ? 'Sim' : 'Não');
      }
    }

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testLoginCredentials().then(() => {
  console.log('\n🏁 Teste concluído');
  console.log('\n📋 Resumo:');
  console.log('1. Verifique se as credenciais estão corretas');
  console.log('2. Confirme os emails se necessário');
  console.log('3. Use as credenciais de teste criadas');
  console.log('4. Acesse: http://localhost:8084');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});



