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

async function createWorkingUsers() {
  console.log('👤 Criando usuários funcionais sem alterar configurações do Supabase...');

  try {
    // Estratégia 1: Usar emails que podem não precisar confirmação
    console.log('\n1. Criando usuários com emails de teste...');
    
    const testUsers = [
      { email: 'test@example.com', password: 'test123456', name: 'Test User' },
      { email: 'demo@example.com', password: 'demo123456', name: 'Demo User' },
      { email: 'admin@example.com', password: 'admin123456', name: 'Admin User' }
    ];

    for (const user of testUsers) {
      console.log(`\n🔑 Criando: ${user.name} (${user.email})`);
      
      // Aguardar para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

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
          
          // Tentar fazer login
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
          console.log(`   ✅ Email confirmado automaticamente!`);
        } else {
          console.log(`   ⚠️ Email não confirmado - tentando login mesmo assim...`);
          
          // Tentar fazer login mesmo sem confirmação
          const { data: testLoginData, error: testLoginError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: user.password
          });

          if (testLoginError) {
            console.log(`   ❌ Login falhou: ${testLoginError.message}`);
          } else {
            console.log(`   ✅ Login funcionou mesmo sem confirmação!`);
            await supabase.auth.signOut();
          }
        }
      }
    }

    // Estratégia 2: Criar usuários com emails que podem ter confirmação automática
    console.log('\n2. Criando usuários com emails especiais...');
    
    const specialUsers = [
      { email: 'noreply@test.com', password: 'noreply123', name: 'No Reply User' },
      { email: 'system@test.com', password: 'system123', name: 'System User' }
    ];

    for (const user of specialUsers) {
      console.log(`\n🔑 Criando: ${user.name} (${user.email})`);
      
      await new Promise(resolve => setTimeout(resolve, 2000));

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
        console.log(`   ❌ Erro: ${signupError.message}`);
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

        // Testar login imediatamente
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
      }
    }

    // Estratégia 3: Verificar se há usuários existentes que funcionam
    console.log('\n3. Verificando usuários existentes que podem funcionar...');
    
    const { data: existingProfiles, error: existingError } = await supabase
      .from('users_profiles')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (existingError) {
      console.log('❌ Erro ao buscar usuários existentes:', existingError.message);
    } else {
      console.log('✅ Usuários existentes encontrados:', existingProfiles?.length || 0);
      
      if (existingProfiles && existingProfiles.length > 0) {
        console.log('\n📋 Usuários disponíveis para teste:');
        existingProfiles.forEach((profile, index) => {
          console.log(`${index + 1}. ${profile.name} (${profile.email})`);
        });
      }
    }

    // Resumo final
    console.log('\n📋 Credenciais de teste criadas:');
    console.log('=' .repeat(50));
    console.log('test@example.com | test123456');
    console.log('demo@example.com | demo123456');
    console.log('admin@example.com | admin123456');
    console.log('noreply@test.com | noreply123');
    console.log('system@test.com | system123');
    console.log('=' .repeat(50));

    console.log('\n🔧 Instruções:');
    console.log('1. Tente fazer login com as credenciais acima');
    console.log('2. Se não funcionar, verifique se o email foi confirmado');
    console.log('3. Use um email real para receber a confirmação');
    console.log('4. Acesse: http://localhost:8084');

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar criação
createWorkingUsers().then(() => {
  console.log('\n🏁 Criação concluída');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});



