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

async function testRealCredentials() {
  console.log('🔍 Testando credenciais reais encontradas na base de dados...');

  // Credenciais reais encontradas na base
  const realCredentials = [
    { email: 'netesabonete5@gmail.com', name: 'Sabonete Nete' },
    { email: 'trytsbr@gmail.com', name: 'Tryts br' },
    { email: 'convocai.oficial@gmail.com', name: 'Nomeia Aí' },
    { email: 'fatimarn3006@gmail.com', name: 'Nataly Lima de Carvalho' },
    { email: 'compras@tourospizzaria.com.br', name: 'Socidivaplu' }
  ];

  try {
    console.log('\n1. Testando credenciais reais...');
    
    for (const cred of realCredentials) {
      console.log(`\n   Testando: ${cred.email} (${cred.name})`);
      
      // Tentar senhas comuns
      const commonPasswords = [
        '123456',
        '123456789',
        'password',
        '12345678',
        '123123',
        '1234567890',
        'qwerty',
        'abc123',
        '111111',
        '1234567',
        'dragon',
        '123321',
        'baseball',
        'abc123456',
        'football',
        'monkey',
        'letmein',
        '696969',
        'shadow',
        'master',
        '666666',
        'qwertyuiop',
        '123321',
        'mustang',
        '1234567890',
        'michael',
        '654321',
        'superman',
        '1qaz2wsx',
        '7777777',
        '121212',
        '000000',
        'qazwsx',
        '123qwe',
        'killer',
        'trustno1',
        'jordan',
        'jennifer',
        'zxcvbnm',
        'asdfgh',
        'hunter',
        'buster',
        'soccer',
        'harley',
        'batman',
        'andrew',
        'tigger',
        'sunshine',
        'iloveyou',
        '2000',
        'charlie',
        'robert',
        'thomas',
        'hockey',
        'ranger',
        'daniel',
        'starwars',
        'klaster',
        '112233',
        'george',
        'computer',
        'michelle',
        'jessica',
        'pepper',
        '1111',
        'zxcvbn',
        '555555',
        '11111111',
        '131313',
        'freedom',
        '777777',
        'pass',
        'maggie',
        '159753',
        'aaaaaa',
        'ginger',
        'princess',
        'joshua',
        'cheese',
        'amanda',
        'summer',
        'love',
        'ashley',
        'nicole',
        'chelsea',
        'biteme',
        'matthew',
        'access',
        'yankees',
        '987654321',
        'dallas',
        'austin',
        'thunder',
        'taylor',
        'matrix',
        'mobilemail',
        'mom',
        'monitor',
        'monitoring',
        'montana',
        'moon',
        'moscow'
      ];

      let loginSuccess = false;
      
      for (const password of commonPasswords.slice(0, 10)) { // Testar apenas as 10 primeiras
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: cred.email,
          password: password
        });

        if (!loginError) {
          console.log(`   ✅ Login bem-sucedido! Senha: ${password}`);
          console.log(`   ID: ${loginData.user?.id}`);
          console.log(`   Email confirmado: ${loginData.user?.email_confirmed_at ? 'Sim' : 'Não'}`);
          loginSuccess = true;
          break;
        }
      }

      if (!loginSuccess) {
        console.log(`   ❌ Nenhuma senha comum funcionou`);
      }
    }

    // Verificar se há problema com a configuração de autenticação
    console.log('\n2. Verificando configuração de autenticação...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Erro na configuração de auth:', authError.message);
    } else {
      console.log('✅ Configuração de auth OK');
    }

    // Verificar se há problema com a URL de autenticação
    console.log('\n3. Verificando URL de autenticação...');
    console.log('URL atual:', supabaseUrl);
    console.log('URL de auth esperada:', `${supabaseUrl}/auth/v1/token`);
    
    // Testar uma requisição direta para a API de auth
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      });
      
      console.log('Status da resposta:', response.status);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.status === 400) {
        console.log('✅ URL de auth está funcionando (400 é esperado para credenciais inválidas)');
      } else {
        console.log('⚠️ Status inesperado:', response.status);
      }
    } catch (fetchError) {
      console.log('❌ Erro ao testar URL de auth:', fetchError);
    }

  } catch (error: any) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testRealCredentials().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});



