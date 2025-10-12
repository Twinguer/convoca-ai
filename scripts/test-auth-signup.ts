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

async function testSignup() {
  console.log('🔍 Testando cadastro no sistema...');
  console.log('URL:', supabaseUrl);
  console.log('Anon Key:', supabaseAnonKey.substring(0, 20) + '...');

  try {
    // Teste 1: Verificar se a URL de auth está acessível
    console.log('\n1. Testando conectividade com Supabase...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('users_profiles')
      .select('count')
      .limit(1);

    if (healthError) {
      console.error('❌ Erro de conectividade:', healthError);
      return;
    }
    console.log('✅ Conectividade OK');

    // Teste 2: Verificar configuração de auth
    console.log('\n2. Testando configuração de autenticação...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Erro na configuração de auth:', authError);
    } else {
      console.log('✅ Configuração de auth OK');
    }

    // Teste 3: Tentar cadastrar um usuário de teste
    console.log('\n3. Testando cadastro de usuário...');
    const testEmail = `teste-${Date.now()}@exemplo.com`;
    const testPassword = 'senha123456';
    const testName = 'Usuário Teste';

    console.log('Email de teste:', testEmail);

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: testName
        },
        emailRedirectTo: `http://localhost:8083/auth/confirmacao-sucesso#`
      }
    });

    if (signupError) {
      console.error('❌ Erro no cadastro:', signupError);
      console.error('Código do erro:', signupError.status);
      console.error('Mensagem:', signupError.message);
      
      // Verificar se é erro de configuração
      if (signupError.message?.includes('Invalid API key')) {
        console.error('🔑 Problema: Chave API inválida');
      } else if (signupError.message?.includes('Invalid email')) {
        console.error('📧 Problema: Email inválido');
      } else if (signupError.message?.includes('Password')) {
        console.error('🔒 Problema: Senha não atende critérios');
      } else if (signupError.message?.includes('User already registered')) {
        console.error('👤 Problema: Usuário já cadastrado');
      } else if (signupError.message?.includes('network') || signupError.message?.includes('fetch')) {
        console.error('🌐 Problema: Erro de rede');
      }
    } else {
      console.log('✅ Cadastro realizado com sucesso!');
      console.log('Usuário criado:', signupData.user?.id);
      console.log('Email confirmado:', signupData.user?.email_confirmed_at ? 'Sim' : 'Não');
      
      if (signupData.user && !signupData.user.email_confirmed_at) {
        console.log('📧 Usuário precisa confirmar email');
      }
    }

    // Teste 4: Verificar se o perfil foi criado
    if (signupData?.user) {
      console.log('\n4. Verificando criação do perfil...');
      const { data: profileData, error: profileError } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('id', signupData.user.id)
        .single();

      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError);
      } else {
        console.log('✅ Perfil criado com sucesso:', profileData);
      }
    }

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testSignup().then(() => {
  console.log('\n🏁 Teste de cadastro concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
