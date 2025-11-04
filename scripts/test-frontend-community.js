import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// ✅ SEGURANÇA: Carregar chaves de variáveis de ambiente
config({ path: 'env.convoca-ai' });

// Usar configuração do sistema (convoca-ai - produção)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ ERRO: VITE_SUPABASE_ANON_KEY não configurado!');
  console.error('   Configure a variável de ambiente ou use o arquivo env.convoca-ai');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontendCommunity() {
  console.log('🧪 Testando acesso à tabela users_profiles (CONVOCA-AI)...\n');

  try {
    // 1. Testar acesso básico à tabela
    console.log('1️⃣ Testando acesso básico à tabela users_profiles...');
    const { data: basicData, error: basicError } = await supabase
      .from('users_profiles')
      .select('id, name, avatar_url')
      .limit(5);

    if (basicError) {
      console.log('❌ Erro ao acessar users_profiles:', basicError.message);
      console.log('   Detalhes:', basicError.details);
      console.log('   Hint:', basicError.hint);
      return;
    } else {
      console.log('✅ Acesso básico funcionando!');
      console.log(`   Encontrados ${basicData.length} perfis`);
      if (basicData.length > 0) {
        console.log('   Primeiro perfil:', basicData[0]);
      }
    }

    // 2. Testar acesso com campos específicos do hook
    console.log('\n2️⃣ Testando acesso com campos específicos do hook...');
    const { data: hookData, error: hookError } = await supabase
      .from('users_profiles')
      .select(`
        id,
        name,
        avatar_url,
        email,
        bio,
        concursos_aprovados,
        status_concurseiro,
        is_studying
      `)
      .limit(5);

    if (hookError) {
      console.log('❌ Erro ao acessar campos específicos:', hookError.message);
      console.log('   Detalhes:', hookError.details);
      console.log('   Hint:', hookError.hint);
      return;
    } else {
      console.log('✅ Acesso com campos específicos funcionando!');
      console.log(`   Encontrados ${hookData.length} perfis`);
      if (hookData.length > 0) {
        console.log('   Primeiro perfil completo:', hookData[0]);
      }
    }

    // 3. Testar busca com filtro (como o hook faz)
    console.log('\n3️⃣ Testando busca com filtro...');
    const { data: searchData, error: searchError } = await supabase
      .from('users_profiles')
      .select(`
        id,
        name,
        avatar_url,
        email,
        bio,
        concursos_aprovados,
        status_concurseiro,
        is_studying
      `)
      .ilike('name', '%test%')
      .limit(5);

    if (searchError) {
      console.log('❌ Erro na busca com filtro:', searchError.message);
      console.log('   Detalhes:', searchError.details);
      console.log('   Hint:', searchError.hint);
      return;
    } else {
      console.log('✅ Busca com filtro funcionando!');
      console.log(`   Encontrados ${searchData.length} perfis com filtro`);
    }

    // 4. Testar RPC count_user_followers
    console.log('\n4️⃣ Testando RPC count_user_followers...');
    if (basicData.length > 0) {
      const testUserId = basicData[0].id;
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('count_user_followers', { user_id: testUserId });

      if (rpcError) {
        console.log('❌ Erro no RPC count_user_followers:', rpcError.message);
        console.log('   Detalhes:', rpcError.details);
        console.log('   Hint:', rpcError.hint);
      } else {
        console.log('✅ RPC count_user_followers funcionando!');
        console.log(`   Seguidores do usuário ${testUserId}: ${rpcData}`);
      }
    }

    // 5. Testar acesso à tabela user_rankings
    console.log('\n5️⃣ Testando acesso à tabela user_rankings...');
    const { data: rankingsData, error: rankingsError } = await supabase
      .from('user_rankings')
      .select('user_id')
      .limit(5);

    if (rankingsError) {
      console.log('❌ Erro ao acessar user_rankings:', rankingsError.message);
      console.log('   Detalhes:', rankingsError.details);
      console.log('   Hint:', rankingsError.hint);
    } else {
      console.log('✅ Acesso à user_rankings funcionando!');
      console.log(`   Encontrados ${rankingsData.length} rankings`);
    }

    console.log('\n🎉 Teste de acesso concluído!');
    console.log('📊 Resumo:');
    console.log('   - Acesso básico:', basicError ? '❌' : '✅');
    console.log('   - Campos específicos:', hookError ? '❌' : '✅');
    console.log('   - Busca com filtro:', searchError ? '❌' : '✅');
    console.log('   - RPC count_user_followers:', rpcError ? '❌' : '✅');
    console.log('   - Acesso user_rankings:', rankingsError ? '❌' : '✅');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testFrontendCommunity();

