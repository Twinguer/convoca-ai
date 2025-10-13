import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConcursosTestTable() {
  console.log('🔍 Verificando tabela concursos_test...\n');

  try {
    // 1. Verificar se a tabela existe
    console.log('1️⃣ Verificando existência da tabela...');
    
    const { data: tableExists, error: tableError } = await supabase
      .from('concursos_test')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Tabela concursos_test não existe ou não é acessível:', tableError.message);
      return;
    }

    console.log('✅ Tabela concursos_test existe!');

    // 2. Contar registros
    console.log('\n2️⃣ Contando registros...');
    
    const { count, error: countError } = await supabase
      .from('concursos_test')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Erro ao contar registros:', countError.message);
    } else {
      console.log(`📊 Total de registros: ${count}`);
    }

    // 3. Buscar alguns registros para análise
    console.log('\n3️⃣ Buscando registros para análise...');
    
    const { data: records, error: recordsError } = await supabase
      .from('concursos_test')
      .select('*')
      .limit(5);

    if (recordsError) {
      console.log('❌ Erro ao buscar registros:', recordsError.message);
    } else {
      console.log(`📋 Encontrados ${records?.length || 0} registros:`);
      records?.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.titulo} (${record.id})`);
        console.log(`      - Órgão: ${record.orgao}`);
        console.log(`      - Banca: ${record.banca}`);
        console.log(`      - Status: ${record.status}`);
        console.log(`      - Criado em: ${record.created_at}`);
        console.log('');
      });
    }

    // 4. Verificar estrutura da tabela
    console.log('4️⃣ Verificando estrutura da tabela...');
    
    const { data: structure, error: structureError } = await supabase
      .rpc('get_table_columns', { table_name: 'concursos_test' });

    if (structureError) {
      console.log('❌ Erro ao obter estrutura:', structureError.message);
      // Tentar obter estrutura de outra forma
      if (records && records.length > 0) {
        console.log('📋 Colunas disponíveis (baseado nos dados):');
        Object.keys(records[0]).forEach(column => {
          console.log(`   - ${column}`);
        });
      }
    } else {
      console.log('📋 Estrutura da tabela concursos_test:');
      structure?.forEach((col: any) => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }

    // 5. Verificar se há dados de teste
    console.log('\n5️⃣ Verificando dados de teste...');
    
    const { data: testData, error: testError } = await supabase
      .from('concursos_test')
      .select('*')
      .ilike('titulo', '%TESTE%');

    if (testError) {
      console.log('❌ Erro ao buscar dados de teste:', testError.message);
    } else {
      console.log(`🧪 Encontrados ${testData?.length || 0} registros de teste:`);
      testData?.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.titulo}`);
        console.log(`      - ID: ${record.id}`);
        console.log(`      - Criado em: ${record.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkConcursosTestTable();
