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

async function checkSystemAccess() {
  console.log('🔍 Verificando acesso ao sistema...');

  try {
    // Teste 1: Conectividade básica
    console.log('\n1. Testando conectividade básica...');
    console.log('URL:', supabaseUrl);
    console.log('Anon Key:', supabaseAnonKey.substring(0, 20) + '...');

    const { data: healthData, error: healthError } = await supabase
      .from('users_profiles')
      .select('count')
      .limit(1);

    if (healthError) {
      console.log('❌ Erro de conectividade:', healthError.message);
      console.log('Código do erro:', healthError.code);
      return;
    }
    console.log('✅ Conectividade OK');

    // Teste 2: Verificar se o servidor de desenvolvimento está rodando
    console.log('\n2. Verificando servidor de desenvolvimento...');
    try {
      const response = await fetch('http://localhost:8083');
      if (response.ok) {
        console.log('✅ Servidor de desenvolvimento está rodando');
        console.log('Status:', response.status);
      } else {
        console.log('❌ Servidor de desenvolvimento não está respondendo');
        console.log('Status:', response.status);
      }
    } catch (fetchError) {
      console.log('❌ Servidor de desenvolvimento não está acessível');
      console.log('Erro:', fetchError);
    }

    // Teste 3: Verificar configuração do frontend
    console.log('\n3. Verificando configuração do frontend...');
    const { data: configData, error: configError } = await supabase
      .from('rankings')
      .select('id, titulo')
      .limit(1);

    if (configError) {
      console.log('❌ Erro na configuração do frontend:', configError.message);
    } else {
      console.log('✅ Configuração do frontend OK');
    }

    // Teste 4: Verificar autenticação
    console.log('\n4. Verificando sistema de autenticação...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Erro na autenticação:', authError.message);
    } else {
      console.log('✅ Sistema de autenticação OK');
    }

    // Teste 5: Verificar se há dados
    console.log('\n5. Verificando dados disponíveis...');
    const { data: rankingsData, error: rankingsError } = await supabase
      .from('rankings')
      .select('id, titulo, status')
      .limit(5);

    if (rankingsError) {
      console.log('❌ Erro ao buscar rankings:', rankingsError.message);
    } else {
      console.log('✅ Rankings encontrados:', rankingsData?.length || 0);
      if (rankingsData && rankingsData.length > 0) {
        console.log('Primeiros rankings:', rankingsData.map(r => r.titulo));
      }
    }

    // Teste 6: Verificar usuários
    console.log('\n6. Verificando usuários...');
    const { data: usersData, error: usersError } = await supabase
      .from('users_profiles')
      .select('id, name, email')
      .limit(3);

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
    } else {
      console.log('✅ Usuários encontrados:', usersData?.length || 0);
    }

    // Teste 7: Verificar se há problemas de CORS ou rede
    console.log('\n7. Verificando problemas de rede...');
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Status da API:', response.status);
      if (response.status === 200) {
        console.log('✅ API do Supabase acessível');
      } else {
        console.log('⚠️ API retornou status:', response.status);
      }
    } catch (apiError) {
      console.log('❌ Erro ao acessar API:', apiError);
    }

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
checkSystemAccess().then(() => {
  console.log('\n🏁 Verificação concluída');
  console.log('\n📋 Resumo:');
  console.log('1. Verifique se o servidor de desenvolvimento está rodando: npm run dev');
  console.log('2. Acesse: http://localhost:8083');
  console.log('3. Se houver problemas, verifique os logs do console');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

