import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRankingsStructure() {
  console.log('🔍 Verificando estrutura da tabela rankings...');

  try {
    // Verificar se a tabela rankings existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'rankings');

    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError);
      return;
    }

    if (!tables || tables.length === 0) {
      console.log('❌ Tabela rankings não existe!');
      return;
    }

    console.log('✅ Tabela rankings existe');

    // Verificar colunas da tabela rankings
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'rankings')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return;
    }

    console.log('\n📋 Colunas da tabela rankings:');
    columns?.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Verificar se data_publicacao existe
    const hasDataPublicacao = columns?.some(col => col.column_name === 'data_publicacao');
    if (!hasDataPublicacao) {
      console.log('\n⚠️  Coluna data_publicacao não existe na tabela rankings!');
      console.log('🔧 Usando created_at para ordenação...');
    } else {
      console.log('\n✅ Coluna data_publicacao existe');
    }

    // Verificar se created_by existe
    const hasCreatedBy = columns?.some(col => col.column_name === 'created_by');
    if (!hasCreatedBy) {
      console.log('\n⚠️  Coluna created_by não existe na tabela rankings!');
    } else {
      console.log('\n✅ Coluna created_by existe');
    }

    // Testar uma query simples
    console.log('\n🧪 Testando query simples...');
    const { data: testData, error: testError } = await supabase
      .from('rankings')
      .select('id, titulo, orgao, banca, created_at')
      .limit(1);

    if (testError) {
      console.error('❌ Erro na query de teste:', testError);
    } else {
      console.log('✅ Query de teste funcionou');
      if (testData && testData.length > 0) {
        console.log('📊 Dados de exemplo:', testData[0]);
      } else {
        console.log('📊 Tabela vazia');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkRankingsStructure();