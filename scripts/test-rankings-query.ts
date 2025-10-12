import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRankingsQuery() {
  console.log('🧪 Testando queries na tabela rankings...');

  try {
    // Teste 1: Query básica
    console.log('\n1. Testando query básica...');
    const { data: basicData, error: basicError } = await supabase
      .from('rankings')
      .select('id, titulo, orgao, banca, created_at')
      .limit(1);

    if (basicError) {
      console.error('❌ Erro na query básica:', basicError);
    } else {
      console.log('✅ Query básica funcionou');
      if (basicData && basicData.length > 0) {
        console.log('📊 Dados:', basicData[0]);
      } else {
        console.log('📊 Tabela vazia');
      }
    }

    // Teste 2: Query com data_publicacao
    console.log('\n2. Testando query com data_publicacao...');
    const { data: dateData, error: dateError } = await supabase
      .from('rankings')
      .select('id, titulo, data_publicacao')
      .limit(1);

    if (dateError) {
      console.error('❌ Erro na query com data_publicacao:', dateError);
      console.log('🔧 Coluna data_publicacao não existe, usando created_at');
    } else {
      console.log('✅ Query com data_publicacao funcionou');
    }

    // Teste 3: Query com created_by
    console.log('\n3. Testando query com created_by...');
    const { data: creatorData, error: creatorError } = await supabase
      .from('rankings')
      .select('id, titulo, created_by')
      .limit(1);

    if (creatorError) {
      console.error('❌ Erro na query com created_by:', creatorError);
    } else {
      console.log('✅ Query com created_by funcionou');
    }

    // Teste 4: Query de ordenação
    console.log('\n4. Testando ordenação...');
    const { data: orderData, error: orderError } = await supabase
      .from('rankings')
      .select('id, titulo, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    if (orderError) {
      console.error('❌ Erro na ordenação:', orderError);
    } else {
      console.log('✅ Ordenação funcionou');
      console.log(`📊 ${orderData?.length || 0} registros encontrados`);
    }

    // Teste 5: Query com filtros
    console.log('\n5. Testando filtros...');
    const { data: filterData, error: filterError } = await supabase
      .from('rankings')
      .select('id, titulo, orgao, banca, status')
      .eq('status', 'Ativo')
      .limit(1);

    if (filterError) {
      console.error('❌ Erro nos filtros:', filterError);
    } else {
      console.log('✅ Filtros funcionaram');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testRankingsQuery();

