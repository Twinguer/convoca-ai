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

async function testBrowserAccess() {
  console.log('🌐 Testando acesso via navegador...');

  try {
    // Teste 1: Verificar se o servidor está rodando
    console.log('\n1. Verificando servidor de desenvolvimento...');
    const serverResponse = await fetch('http://localhost:8083');
    
    if (serverResponse.ok) {
      console.log('✅ Servidor está rodando');
      console.log('Status:', serverResponse.status);
      console.log('URL: http://localhost:8083');
    } else {
      console.log('❌ Servidor não está respondendo');
      console.log('Status:', serverResponse.status);
      return;
    }

    // Teste 2: Verificar se a página principal carrega
    console.log('\n2. Verificando página principal...');
    try {
      const pageResponse = await fetch('http://localhost:8083/');
      if (pageResponse.ok) {
        console.log('✅ Página principal carrega');
        const html = await pageResponse.text();
        if (html.includes('Nomeia Aí') || html.includes('React')) {
          console.log('✅ Conteúdo da página está correto');
        } else {
          console.log('⚠️ Conteúdo da página pode estar incorreto');
        }
      } else {
        console.log('❌ Página principal não carrega');
        console.log('Status:', pageResponse.status);
      }
    } catch (pageError) {
      console.log('❌ Erro ao carregar página:', pageError);
    }

    // Teste 3: Verificar se há problemas de CORS
    console.log('\n3. Verificando problemas de CORS...');
    try {
      const corsResponse = await fetch('http://localhost:8083/api/test', {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:8083',
          'Content-Type': 'application/json'
        }
      });
      console.log('Status CORS:', corsResponse.status);
    } catch (corsError) {
      console.log('ℹ️ Teste de CORS não aplicável (endpoint não existe)');
    }

    // Teste 4: Verificar configuração do Supabase no frontend
    console.log('\n4. Verificando configuração do Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('rankings')
      .select('id, titulo')
      .limit(1);

    if (testError) {
      console.log('❌ Erro na configuração do Supabase:', testError.message);
    } else {
      console.log('✅ Configuração do Supabase OK');
    }

    // Teste 5: Verificar se há problemas de ambiente
    console.log('\n5. Verificando variáveis de ambiente...');
    console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL || 'NÃO DEFINIDA');
    console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'NÃO DEFINIDA');

    // Teste 6: Verificar se há problemas de build
    console.log('\n6. Verificando se há problemas de build...');
    try {
      const buildResponse = await fetch('http://localhost:8083/assets/');
      if (buildResponse.ok) {
        console.log('✅ Assets carregam corretamente');
      } else {
        console.log('⚠️ Problema com assets');
      }
    } catch (assetError) {
      console.log('ℹ️ Teste de assets não aplicável');
    }

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testBrowserAccess().then(() => {
  console.log('\n🏁 Teste concluído');
  console.log('\n📋 Instruções para acessar:');
  console.log('1. Abra o navegador');
  console.log('2. Acesse: http://localhost:8083');
  console.log('3. Se não carregar, verifique se o servidor está rodando');
  console.log('4. Se houver erro, verifique o console do navegador (F12)');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

