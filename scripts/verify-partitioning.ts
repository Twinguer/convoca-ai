import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function verifyPartitioning() {
  console.log('🔍 Verificando particionamento implementado...');
  
  try {
    // 1. Verificar se as tabelas particionadas existem
    console.log('\n📊 Verificando tabelas particionadas...');
    
    const { data: partitionedTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%_partitioned');
    
    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas particionadas:', tablesError.message);
      return;
    }
    
    if (partitionedTables && partitionedTables.length > 0) {
      console.log('✅ Tabelas particionadas encontradas:');
      partitionedTables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    } else {
      console.log('⚠️ Nenhuma tabela particionada encontrada');
    }
    
    // 2. Verificar partições específicas
    console.log('\n📊 Verificando partições...');
    
    const { data: partitions, error: partitionsError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%_p%');
    
    if (partitionsError) {
      console.error('❌ Erro ao verificar partições:', partitionsError.message);
      return;
    }
    
    if (partitions && partitions.length > 0) {
      console.log('✅ Partições encontradas:');
      partitions.forEach(partition => {
        console.log(`  - ${partition.table_name}`);
      });
    } else {
      console.log('⚠️ Nenhuma partição encontrada');
    }
    
    // 3. Verificar índices das tabelas particionadas
    console.log('\n📊 Verificando índices...');
    
    const { data: indexes, error: indexesError } = await supabase
      .from('pg_indexes')
      .select('tablename, indexname')
      .eq('schemaname', 'public')
      .like('tablename', '%_partitioned');
    
    if (indexesError) {
      console.error('❌ Erro ao verificar índices:', indexesError.message);
      return;
    }
    
    if (indexes && indexes.length > 0) {
      console.log('✅ Índices das tabelas particionadas:');
      indexes.forEach(index => {
        console.log(`  - ${index.tablename}.${index.indexname}`);
      });
    } else {
      console.log('⚠️ Nenhum índice encontrado para tabelas particionadas');
    }
    
    // 4. Testar performance básica
    console.log('\n📊 Testando performance básica...');
    
    const startTime = performance.now();
    
    const { data: testData, error: testError } = await supabase
      .from('rankings')
      .select('id, titulo, total_participants')
      .limit(10);
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    if (testError) {
      console.error('❌ Erro no teste de performance:', testError.message);
      return;
    }
    
    console.log(`✅ Teste de performance executado em ${executionTime.toFixed(2)}ms`);
    console.log(`📊 Registros retornados: ${testData?.length || 0}`);
    
    // 5. Verificar configurações de performance
    console.log('\n📊 Verificando configurações de performance...');
    
    const { data: settings, error: settingsError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT name, setting, unit FROM pg_settings WHERE name IN ('work_mem', 'effective_cache_size', 'shared_buffers')` 
      });
    
    if (settingsError) {
      console.log('⚠️ Não foi possível verificar configurações (normal em Supabase)');
    } else {
      console.log('✅ Configurações de performance:');
      settings?.forEach(setting => {
        console.log(`  - ${setting.name}: ${setting.setting} ${setting.unit || ''}`);
      });
    }
    
    console.log('\n🎉 Verificação de particionamento concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
verifyPartitioning().catch(console.error);



