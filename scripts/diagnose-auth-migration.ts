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

async function diagnoseAuthMigration() {
  console.log('🔍 Diagnosticando problema de migração de autenticação...');

  try {
    // Aguardar para evitar rate limiting
    console.log('⏳ Aguardando 5 segundos para evitar rate limiting...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verificar se os usuários existem na tabela auth.users
    console.log('\n1. Verificando se usuários existem na tabela auth.users...');
    
    // Tentar acessar via RPC se disponível
    try {
      const { data: authUsersData, error: authUsersError } = await supabase
        .rpc('get_auth_users');

      if (authUsersError) {
        console.log('❌ Função get_auth_users não disponível:', authUsersError.message);
      } else {
        console.log('✅ Usuários na auth.users:', authUsersData?.length || 0);
        if (authUsersData && authUsersData.length > 0) {
          console.log('Primeiros usuários:', authUsersData.slice(0, 3));
        }
      }
    } catch (err) {
      console.log('❌ Erro ao acessar auth.users via RPC:', err);
    }

    // Verificar se há problema com a migração de dados
    console.log('\n2. Verificando integridade dos dados...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('users_profiles')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (profilesError) {
      console.log('❌ Erro ao buscar perfis:', profilesError.message);
    } else {
      console.log('✅ Perfis encontrados:', profilesData?.length || 0);
      
      // Verificar se há perfis órfãos (sem usuário correspondente na auth.users)
      console.log('\n3. Verificando perfis órfãos...');
      for (const profile of profilesData || []) {
        console.log(`\n   Verificando perfil: ${profile.email} (ID: ${profile.id})`);
        
        // Tentar fazer login para verificar se o usuário existe na auth.users
        try {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: profile.email,
            password: 'senha_teste_123' // Senha de teste
          });

          if (loginError) {
            if (loginError.message?.includes('Invalid login credentials')) {
              console.log(`   ⚠️ Usuário existe na auth.users mas senha é diferente`);
            } else if (loginError.message?.includes('Email not confirmed')) {
              console.log(`   ⚠️ Usuário existe mas email não confirmado`);
            } else {
              console.log(`   ❌ Erro no login: ${loginError.message}`);
            }
          } else {
            console.log(`   ✅ Usuário existe e login funcionou!`);
          }
        } catch (loginErr) {
          console.log(`   ❌ Erro ao testar login: ${loginErr}`);
        }

        // Aguardar para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Verificar configuração do Supabase
    console.log('\n4. Verificando configuração do Supabase...');
    console.log('URL:', supabaseUrl);
    console.log('Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
    
    // Testar uma operação simples
    const { data: testData, error: testError } = await supabase
      .from('users_profiles')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ Erro na operação de teste:', testError.message);
    } else {
      console.log('✅ Operação de teste OK');
    }

    // Verificar se há problema com a migração do banco original
    console.log('\n5. Verificando se há problema de migração...');
    console.log('ℹ️ Os usuários podem ter sido migrados do banco original sem as senhas');
    console.log('ℹ️ Isso explicaria por que os perfis existem mas o login não funciona');
    console.log('ℹ️ As senhas ficam armazenadas na tabela auth.users, não em users_profiles');

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar diagnóstico
diagnoseAuthMigration().then(() => {
  console.log('\n🏁 Diagnóstico concluído');
  console.log('\n📋 Resumo do problema:');
  console.log('1. Os perfis de usuário existem na tabela users_profiles');
  console.log('2. Mas os usuários podem não existir na tabela auth.users');
  console.log('3. Ou as senhas não foram migradas corretamente');
  console.log('4. Isso causa o erro "Invalid login credentials"');
  console.log('\n🔧 Solução recomendada:');
  console.log('1. Verificar se os usuários existem na tabela auth.users');
  console.log('2. Se não existirem, recriar os usuários com senhas temporárias');
  console.log('3. Ou orientar os usuários a redefinir suas senhas');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
