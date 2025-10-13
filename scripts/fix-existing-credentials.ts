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

async function fixExistingCredentials() {
  console.log('🔧 Corrigindo credenciais existentes...');

  try {
    // Aguardar para evitar rate limiting
    console.log('⏳ Aguardando 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Buscar usuários existentes
    console.log('\n1. Buscando usuários existentes...');
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

    if (!profilesData || profilesData.length === 0) {
      console.log('ℹ️ Nenhum perfil encontrado para corrigir');
      return;
    }

    // Gerar senhas temporárias para cada usuário
    console.log('\n2. Gerando senhas temporárias...');
    const tempPasswords = new Map<string, string>();
    
    for (const profile of profilesData) {
      // Gerar senha temporária baseada no email
      const tempPassword = `temp_${profile.email.split('@')[0]}_123`;
      tempPasswords.set(profile.email, tempPassword);
      console.log(`   ${profile.name} (${profile.email}): ${tempPassword}`);
    }

    // Tentar recriar usuários com senhas temporárias
    console.log('\n3. Recriando usuários com senhas temporárias...');
    
    for (const profile of profilesData) {
      console.log(`\n   Processando: ${profile.name} (${profile.email})`);
      
      try {
        // Aguardar para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

        const tempPassword = tempPasswords.get(profile.email) || 'temp123456';
        
        // Tentar fazer signup (pode falhar se usuário já existe)
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: profile.email,
          password: tempPassword,
          options: {
            data: {
              name: profile.name
            }
          }
        });

        if (signupError) {
          if (signupError.message?.includes('User already registered')) {
            console.log(`   ⚠️ Usuário já existe na auth.users`);
            
            // Tentar fazer login com senha temporária
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
              email: profile.email,
              password: tempPassword
            });

            if (loginError) {
              console.log(`   ❌ Login falhou: ${loginError.message}`);
              console.log(`   💡 Usuário precisa redefinir senha manualmente`);
            } else {
              console.log(`   ✅ Login funcionou! Senha temporária: ${tempPassword}`);
            }
          } else {
            console.log(`   ❌ Erro no signup: ${signupError.message}`);
          }
        } else {
          console.log(`   ✅ Usuário recriado! Senha temporária: ${tempPassword}`);
        }

      } catch (error) {
        console.log(`   ❌ Erro ao processar usuário: ${error}`);
      }
    }

    // Resumo das credenciais temporárias
    console.log('\n📋 Resumo das credenciais temporárias:');
    console.log('=' .repeat(50));
    for (const [email, password] of tempPasswords) {
      console.log(`${email} | ${password}`);
    }
    console.log('=' .repeat(50));

    console.log('\n🔧 Próximos passos:');
    console.log('1. Compartilhe as credenciais temporárias com os usuários');
    console.log('2. Oriente-os a alterar a senha no primeiro login');
    console.log('3. Ou implemente um sistema de redefinição de senha');

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar correção
fixExistingCredentials().then(() => {
  console.log('\n🏁 Correção concluída');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});



