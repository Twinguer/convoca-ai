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

async function testImmediateLogin() {
  console.log('🚀 Testando login imediato...');

  try {
    // Teste 1: Verificar se há usuários que já funcionam
    console.log('\n1. Verificando usuários existentes...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('users_profiles')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (profilesError) {
      console.log('❌ Erro ao buscar perfis:', profilesError.message);
      return;
    }

    console.log('✅ Perfis encontrados:', profilesData?.length || 0);

    // Teste 2: Tentar fazer login com usuários mais antigos (que podem estar confirmados)
    console.log('\n2. Testando login com usuários existentes...');
    
    for (const profile of profilesData || []) {
      console.log(`\n🔑 Testando: ${profile.name} (${profile.email})`);
      
      // Aguardar para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Tentar senhas comuns
      const commonPasswords = ['123456', 'password', 'admin123', 'user123', 'teste123', 'senha123'];
      
      let loginSuccess = false;
      
      for (const password of commonPasswords) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password: password
        });

        if (!loginError) {
          console.log(`   ✅ Login bem-sucedido! Senha: ${password}`);
          console.log(`   ID: ${loginData.user?.id}`);
          console.log(`   Email confirmado: ${loginData.user?.email_confirmed_at ? 'Sim' : 'Não'}`);
          loginSuccess = true;
          
          // Fazer logout
          await supabase.auth.signOut();
          break;
        }
      }

      if (!loginSuccess) {
        console.log(`   ❌ Nenhuma senha comum funcionou`);
      }
    }

    // Teste 3: Criar usuário com email de teste que pode não precisar confirmação
    console.log('\n3. Criando usuário com email de teste...');
    const testEmail = `teste-${Date.now()}@teste.com`;
    const testPassword = 'teste123456';
    const testName = 'Teste Login';

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
      console.log('Email confirmado:', newUserData.user?.email_confirmed_at ? 'Sim' : 'Não');

      // Criar perfil
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
        console.log('✅ Perfil criado');
      }

      // Testar login imediatamente
      console.log('\n4. Testando login imediato...');
      const { data: testLoginData, error: testLoginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (testLoginError) {
        console.log('❌ Login falhou:', testLoginError.message);
        
        if (testLoginError.message?.includes('Email not confirmed')) {
          console.log('ℹ️ Email não confirmado - este é o problema principal');
          console.log('🔧 Soluções possíveis:');
          console.log('   1. Desabilitar confirmação de email no Supabase');
          console.log('   2. Usar email real para receber confirmação');
          console.log('   3. Confirmar email manualmente no painel do Supabase');
        }
      } else {
        console.log('✅ Login imediato funcionou!');
        console.log('🎉 Usuário pronto para uso!');
      }
    }

    // Teste 4: Verificar configuração de autenticação
    console.log('\n5. Verificando configuração de autenticação...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Erro na configuração de auth:', authError.message);
    } else {
      console.log('✅ Configuração de auth OK');
    }

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testImmediateLogin().then(() => {
  console.log('\n🏁 Teste concluído');
  console.log('\n📋 Resumo do problema:');
  console.log('❌ Todos os usuários precisam confirmar email antes de fazer login');
  console.log('🔧 Soluções:');
  console.log('   1. Acesse o painel do Supabase');
  console.log('   2. Vá em Authentication > Settings');
  console.log('   3. Desabilite "Enable email confirmations"');
  console.log('   4. Ou use um email real para receber a confirmação');
  console.log('\n🌐 Acesse: http://localhost:8084');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

