import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyRankingsStructure() {
  console.log('🔍 Verificando estrutura da tabela rankings...');

  try {
    // Teste 1: Query básica para ver todas as colunas
    console.log('\n1. Testando query básica...');
    const { data: basicData, error: basicError } = await supabase
      .from('rankings')
      .select('*')
      .limit(1);

    if (basicError) {
      console.error('❌ Erro na query básica:', basicError);
      return;
    }

    console.log('✅ Query básica funcionou');
    if (basicData && basicData.length > 0) {
      console.log('📊 Colunas disponíveis na tabela rankings:');
      Object.keys(basicData[0]).forEach(column => {
        console.log(`  - ${column}`);
      });
    }

    // Teste 2: Verificar colunas específicas que podem estar sendo usadas
    const columnsToCheck = [
      'id', 'titulo', 'orgao', 'banca', 'status', 'created_at', 'updated_at',
      'created_by', 'etapa_atual', 'disciplines', 'exam_type', 'has_minimum_score',
      'total_minimum_score', 'wrong_answer_penalty', 'total_participants'
    ];

    console.log('\n2. Verificando colunas específicas...');
    const { data: specificData, error: specificError } = await supabase
      .from('rankings')
      .select(columnsToCheck.join(', '))
      .limit(1);

    if (specificError) {
      console.error('❌ Erro na query específica:', specificError);
      console.log('🔧 Colunas que não existem:');
      // Tentar identificar quais colunas não existem
      for (const column of columnsToCheck) {
        const { error: columnError } = await supabase
          .from('rankings')
          .select(column)
          .limit(1);
        
        if (columnError) {
          console.log(`  ❌ ${column}: ${columnError.message}`);
        } else {
          console.log(`  ✅ ${column}: OK`);
        }
      }
    } else {
      console.log('✅ Todas as colunas específicas existem');
    }

    // Teste 3: Verificar se a query que estava falhando agora funciona
    console.log('\n3. Testando query que estava falhando...');
    const { data: testData, error: testError } = await supabase
      .from('rankings')
      .select('id, titulo, orgao, banca, created_at')
      .eq('created_at', '2025-10-11');

    if (testError) {
      console.error('❌ Erro na query de teste:', testError);
    } else {
      console.log('✅ Query de teste funcionou');
      console.log(`📊 ${testData?.length || 0} registros encontrados`);
    }

    // Teste 4: Verificar query com filtro undefined
    console.log('\n4. Testando query com filtro undefined...');
    const { data: undefinedData, error: undefinedError } = await supabase
      .from('rankings')
      .select('id, titulo, orgao, banca, created_at')
      .eq('created_at', 'undefined');

    if (undefinedError) {
      console.error('❌ Erro na query com undefined:', undefinedError);
    } else {
      console.log('✅ Query com undefined funcionou (retornou 0 resultados)');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verifyRankingsStructure();

