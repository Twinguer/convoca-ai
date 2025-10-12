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

async function checkExistingUsers() {
  console.log('🔍 Verificando usuários existentes e credenciais...');

  try {
    // Verificar usuários na tabela users_profiles
    console.log('\n1. Verificando usuários na tabela users_profiles...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('users_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (profilesError) {
      console.log('❌ Erro ao buscar perfis:', profilesError.message);
    } else {
      console.log('✅ Perfis encontrados:', profilesData?.length || 0);
      if (profilesData && profilesData.length > 0) {
        console.log('\n📋 Usuários existentes:');
        profilesData.forEach((profile, index) => {
          console.log(`${index + 1}. ${profile.name} (${profile.email}) - ID: ${profile.id}`);
          console.log(`   Criado em: ${profile.created_at}`);
        });
      }
    }

    // Verificar se há usuários na tabela auth.users (se possível)
    console.log('\n2. Verificando tabela auth.users...');
    try {
      const { data: authUsersData, error: authUsersError } = await supabase
        .from('auth.users')
        .select('*')
        .limit(5);

      if (authUsersError) {
        console.log('❌ Não é possível acessar auth.users diretamente:', authUsersError.message);
      } else {
        console.log('✅ Acesso a auth.users OK');
        console.log('Usuários na auth.users:', authUsersData?.length || 0);
      }
    } catch (err) {
      console.log('❌ Erro ao acessar auth.users:', err);
    }

    // Testar login com credenciais de teste
    console.log('\n3. Testando login com credenciais de teste...');
    const testCredentials = [
      { email: 'teste@exemplo.com', password: 'senha123456' },
      { email: 'admin@exemplo.com', password: 'admin123' },
      { email: 'user@exemplo.com', password: 'user123' }
    ];

    for (const cred of testCredentials) {
      console.log(`\n   Testando: ${cred.email}`);
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: cred.email,
        password: cred.password
      });

      if (loginError) {
        console.log(`   ❌ Erro: ${loginError.message}`);
      } else {
        console.log(`   ✅ Login bem-sucedido! ID: ${loginData.user?.id}`);
      }
    }

    // Verificar configuração de autenticação
    console.log('\n4. Verificando configuração de autenticação...');
    const { data: authConfig, error: authConfigError } = await supabase.auth.getSession();
    
    if (authConfigError) {
      console.log('❌ Erro na configuração de auth:', authConfigError.message);
    } else {
      console.log('✅ Configuração de auth OK');
      console.log('Sessão ativa:', authConfig.session ? 'Sim' : 'Não');
    }

    // Verificar se há problemas de migração
    console.log('\n5. Verificando problemas de migração...');
    const { data: migrationData, error: migrationError } = await supabase
      .from('users_profiles')
      .select('id, email, name, created_at')
      .is('id', null);

    if (migrationError) {
      console.log('❌ Erro ao verificar migração:', migrationError.message);
    } else {
      console.log('✅ Verificação de migração OK');
      if (migrationData && migrationData.length > 0) {
        console.log('⚠️ Encontrados perfis com ID nulo:', migrationData.length);
      }
    }

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
checkExistingUsers().then(() => {
  console.log('\n🏁 Verificação concluída');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

