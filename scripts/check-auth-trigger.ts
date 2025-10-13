import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAuthTrigger() {
  console.log('🔍 Verificando trigger de autenticação...');

  try {
    // Verificar se o trigger existe
    console.log('\n1. Verificando se o trigger existe...');
    const { data: triggerData, error: triggerError } = await supabase
      .rpc('check_trigger_exists', { trigger_name: 'on_auth_user_created' });

    if (triggerError) {
      console.log('❌ Erro ao verificar trigger:', triggerError);
    } else {
      console.log('✅ Trigger verificado:', triggerData);
    }

    // Verificar se a função handle_new_user existe
    console.log('\n2. Verificando se a função handle_new_user existe...');
    const { data: functionData, error: functionError } = await supabase
      .rpc('check_function_exists', { function_name: 'handle_new_user' });

    if (functionError) {
      console.log('❌ Erro ao verificar função:', functionError);
    } else {
      console.log('✅ Função verificada:', functionData);
    }

    // Verificar usuários recentes
    console.log('\n3. Verificando usuários recentes...');
    const { data: usersData, error: usersError } = await supabase
      .from('users_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError);
    } else {
      console.log('✅ Usuários encontrados:', usersData?.length || 0);
      if (usersData && usersData.length > 0) {
        console.log('Último usuário:', usersData[0]);
      }
    }

    // Verificar se há usuários na tabela auth.users (se possível)
    console.log('\n4. Verificando tabela auth.users...');
    const { data: authUsersData, error: authUsersError } = await supabase
      .from('auth.users')
      .select('*')
      .limit(1);

    if (authUsersError) {
      console.log('❌ Não é possível acessar auth.users diretamente:', authUsersError.message);
    } else {
      console.log('✅ Acesso a auth.users OK');
    }

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
checkAuthTrigger().then(() => {
  console.log('\n🏁 Verificação concluída');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});



