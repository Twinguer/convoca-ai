import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixAuthTrigger() {
  console.log('🔧 Corrigindo trigger de autenticação...');

  const sql = `
-- Remove o trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove a função antiga se existir
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Cria a função para criar perfil automaticamente quando um usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_profiles (id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Perfil já existe, não fazer nada
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log do erro mas não bloqueia o signup
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Cria o trigger que dispara automaticamente após inserção de novo usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verificar se o trigger foi criado
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
  `;

  try {
    console.log('1. Aplicando correção do trigger...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.log('❌ Erro ao aplicar SQL:', error);
      
      // Tentar método alternativo - executar via query direta
      console.log('2. Tentando método alternativo...');
      const { data: altData, error: altError } = await supabase
        .from('users_profiles')
        .select('count')
        .limit(1);

      if (altError) {
        console.log('❌ Erro de conectividade:', altError);
        return;
      }

      console.log('✅ Conectividade OK, mas não foi possível executar SQL diretamente');
      console.log('📋 SQL para executar manualmente no Supabase SQL Editor:');
      console.log('---');
      console.log(sql);
      console.log('---');
      
    } else {
      console.log('✅ Trigger corrigido com sucesso!');
      console.log('Dados retornados:', data);
    }

    // Testar o trigger
    console.log('\n3. Testando trigger corrigido...');
    const testEmail = `teste-trigger-fix-${Date.now()}@exemplo.com`;
    const testPassword = 'senha123456';

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Teste Trigger Fix'
        }
      }
    });

    if (signupError) {
      console.log('❌ Erro no cadastro de teste:', signupError.message);
    } else {
      console.log('✅ Usuário de teste criado:', signupData.user?.id);
      
      // Aguardar e verificar se o perfil foi criado
      console.log('⏳ Aguardando 3 segundos...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const { data: profileData, error: profileError } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('id', signupData.user?.id)
        .single();

      if (profileError) {
        console.log('❌ Perfil ainda não foi criado:', profileError.message);
        console.log('🔧 Pode ser necessário executar o SQL manualmente no Supabase');
      } else {
        console.log('✅ Perfil criado automaticamente! Trigger funcionando!');
        console.log('Perfil:', profileData);
      }
    }

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar correção
fixAuthTrigger().then(() => {
  console.log('\n🏁 Correção concluída');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

