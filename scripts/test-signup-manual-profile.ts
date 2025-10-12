import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignupWithManualProfile() {
  console.log('🔍 Testando cadastro com criação manual de perfil...');

  try {
    // Teste 1: Cadastrar usuário
    console.log('\n1. Cadastrando usuário...');
    const testEmail = `usuario-teste-${Date.now()}@exemplo.com`;
    const testPassword = 'senha123456';
    const testName = 'Usuário Teste';

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: testName
        }
      }
    });

    if (signupError) {
      console.log('❌ Erro no cadastro:', signupError.message);
      return;
    }

    console.log('✅ Usuário cadastrado com sucesso!');
    console.log('ID do usuário:', signupData.user?.id);
    console.log('Email:', signupData.user?.email);
    console.log('Email confirmado:', signupData.user?.email_confirmed_at ? 'Sim' : 'Não');

    // Teste 2: Criar perfil manualmente
    console.log('\n2. Criando perfil manualmente...');
    const { data: profileData, error: profileError } = await supabase
      .from('users_profiles')
      .insert({
        id: signupData.user?.id,
        email: testEmail,
        name: testName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.log('❌ Erro ao criar perfil:', profileError.message);
      
      // Verificar se o perfil já existe
      if (profileError.message?.includes('duplicate key') || profileError.message?.includes('unique constraint')) {
        console.log('ℹ️ Perfil já existe, buscando dados...');
        const { data: existingProfile, error: fetchError } = await supabase
          .from('users_profiles')
          .select('*')
          .eq('id', signupData.user?.id)
          .single();

        if (fetchError) {
          console.log('❌ Erro ao buscar perfil existente:', fetchError.message);
        } else {
          console.log('✅ Perfil existente encontrado:', existingProfile);
        }
      }
    } else {
      console.log('✅ Perfil criado com sucesso!');
      console.log('Perfil:', profileData);
    }

    // Teste 3: Fazer login
    console.log('\n3. Testando login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('Usuário logado:', loginData.user?.id);
    }

    // Teste 4: Verificar sessão
    console.log('\n4. Verificando sessão...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.log('❌ Erro ao verificar sessão:', sessionError.message);
    } else {
      console.log('✅ Sessão ativa:', sessionData.session ? 'Sim' : 'Não');
      if (sessionData.session) {
        console.log('Usuário da sessão:', sessionData.session.user?.id);
      }
    }

    // Teste 5: Fazer logout
    console.log('\n5. Testando logout...');
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      console.log('❌ Erro no logout:', logoutError.message);
    } else {
      console.log('✅ Logout realizado com sucesso!');
    }

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testSignupWithManualProfile().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

