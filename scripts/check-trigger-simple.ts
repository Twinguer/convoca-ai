import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTriggerSimple() {
  console.log('🔍 Verificando trigger de autenticação (método simples)...');

  try {
    // Verificar se a função handle_new_user existe tentando executá-la
    console.log('\n1. Testando função handle_new_user...');
    const { data: functionData, error: functionError } = await supabase
      .rpc('handle_new_user');

    if (functionError) {
      if (functionError.message?.includes('function handle_new_user') && functionError.message?.includes('does not exist')) {
        console.log('❌ Função handle_new_user não existe');
      } else {
        console.log('⚠️ Função existe mas retornou erro:', functionError.message);
      }
    } else {
      console.log('✅ Função handle_new_user existe');
    }

    // Verificar usuários recentes
    console.log('\n2. Verificando usuários recentes...');
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
        console.log('Último usuário criado:', usersData[0].created_at);
        console.log('Total de usuários:', usersData.length);
      }
    }

    // Tentar criar um usuário de teste para ver se o trigger funciona
    console.log('\n3. Testando criação de usuário...');
    const testEmail = `teste-trigger-${Date.now()}@exemplo.com`;
    const testPassword = 'senha123456';

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Teste Trigger'
        }
      }
    });

    if (signupError) {
      console.log('❌ Erro no cadastro:', signupError.message);
    } else {
      console.log('✅ Usuário criado:', signupData.user?.id);
      
      // Aguardar um pouco e verificar se o perfil foi criado
      console.log('⏳ Aguardando 2 segundos para o trigger executar...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: profileData, error: profileError } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('id', signupData.user?.id)
        .single();

      if (profileError) {
        console.log('❌ Perfil não foi criado automaticamente:', profileError.message);
        console.log('🔧 O trigger não está funcionando corretamente');
      } else {
        console.log('✅ Perfil criado automaticamente:', profileData);
      }
    }

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
checkTriggerSimple().then(() => {
  console.log('\n🏁 Verificação concluída');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

