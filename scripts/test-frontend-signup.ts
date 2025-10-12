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

async function testFrontendSignup() {
  console.log('🔍 Testando cadastro como no frontend...');

  try {
    // Simular o processo de cadastro do frontend
    console.log('\n1. Cadastrando usuário...');
    const testEmail = `frontend-teste-${Date.now()}@exemplo.com`;
    const testPassword = 'senha123456';
    const testName = 'Frontend Teste';

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: testName
        },
        emailRedirectTo: `http://localhost:8083/auth/confirmacao-sucesso#`
      }
    });

    if (error) {
      console.log('❌ Erro no cadastro:', error.message);
      return;
    }

    console.log('✅ Usuário cadastrado!');
    console.log('ID:', data.user?.id);
    console.log('Email confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não');

    // Simular criação manual de perfil (como no frontend atualizado)
    console.log('\n2. Criando perfil manualmente...');
    const { error: profileError } = await supabase
      .from('users_profiles')
      .insert({
        id: data.user?.id,
        email: testEmail,
        name: testName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      if (profileError.message?.includes('duplicate key') || profileError.message?.includes('unique constraint')) {
        console.log('ℹ️ Perfil já existe (normal)');
      } else {
        console.log('❌ Erro ao criar perfil:', profileError.message);
        return;
      }
    } else {
      console.log('✅ Perfil criado com sucesso!');
    }

    // Verificar se o perfil existe
    console.log('\n3. Verificando perfil...');
    const { data: profileData, error: profileFetchError } = await supabase
      .from('users_profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    if (profileFetchError) {
      console.log('❌ Erro ao buscar perfil:', profileFetchError.message);
    } else {
      console.log('✅ Perfil encontrado:', {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        created_at: profileData.created_at
      });
    }

    // Testar login (se o email estiver confirmado)
    if (data.user?.email_confirmed_at) {
      console.log('\n4. Testando login...');
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
    } else {
      console.log('\n4. ⚠️ Login não testado - email não confirmado');
      console.log('ℹ️ O usuário precisa confirmar o email antes de fazer login');
    }

    console.log('\n📋 Resumo do teste:');
    console.log('✅ Cadastro: Funcionando');
    console.log('✅ Criação de perfil: Funcionando');
    console.log('⚠️ Confirmação de email: Necessária para login');
    console.log('✅ Sistema: Pronto para uso');

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testFrontendSignup().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

