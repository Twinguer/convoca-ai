import { createClient } from '@supabase/supabase-js';

// Configuração do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('🔐 Testando autenticação no convoca-ai...');
  console.log('URL:', supabaseUrl);
  
  // Teste 1: Verificar usuários em auth.users
  console.log('\n📊 Teste 1: Verificando auth.users...');
  try {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.log('❌ Erro ao buscar auth.users:', authError.message);
    } else {
      console.log('✅ Usuários de autenticação encontrados:', authUsers?.users?.length || 0);
      if (authUsers?.users?.length > 0) {
        authUsers.users.forEach(user => {
          console.log(`  - ${user.email} (${user.id})`);
        });
      }
    }
  } catch (err) {
    console.log('❌ Erro geral ao buscar auth.users:', err.message);
  }

  // Teste 2: Verificar users_profiles
  console.log('\n📊 Teste 2: Verificando users_profiles...');
  const { data: profiles, error: profilesError } = await supabase
    .from('users_profiles')
    .select('id, name, email')
    .limit(5);
  
  if (profilesError) {
    console.log('❌ Erro ao buscar users_profiles:', profilesError.message);
  } else {
    console.log('✅ User profiles encontrados:', profiles?.length || 0);
    profiles?.forEach(profile => {
      console.log(`  - ${profile.name} (${profile.email})`);
    });
  }

  // Teste 3: Tentar fazer login com um usuário existente
  console.log('\n📊 Teste 3: Tentando fazer login...');
  if (profiles && profiles.length > 0) {
    const testUser = profiles[0];
    console.log(`Tentando login com: ${testUser.email}`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: '123456789' // senha padrão
      });
      
      if (error) {
        console.log('❌ Erro no login:', error.message);
      } else {
        console.log('✅ Login bem-sucedido!');
        console.log('User ID:', data.user?.id);
      }
    } catch (err) {
      console.log('❌ Erro geral no login:', err.message);
    }
  }

  // Teste 4: Verificar se há usuários sem conta de auth
  console.log('\n📊 Teste 4: Verificando desincronização...');
  if (profiles && profiles.length > 0) {
    console.log('Usuários com perfil mas sem conta de auth:');
    for (const profile of profiles) {
      try {
        const { data: authUser, error } = await supabase.auth.admin.getUserById(profile.id);
        if (error || !authUser.user) {
          console.log(`  ❌ ${profile.name} (${profile.email}) - SEM CONTA DE AUTH`);
        } else {
          console.log(`  ✅ ${profile.name} (${profile.email}) - COM CONTA DE AUTH`);
        }
      } catch (err) {
        console.log(`  ❌ ${profile.name} (${profile.email}) - ERRO: ${err.message}`);
      }
    }
  }
}

testAuth().catch(console.error);
