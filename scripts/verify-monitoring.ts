import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function verifyMonitoring() {
  console.log('📊 Verificando monitoramento de performance implementado...');
  
  try {
    // 1. Verificar se a tabela de métricas existe
    console.log('\n📊 Verificando tabela de métricas...');
    
    const { data: metricsTable, error: metricsError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'performance_metrics');
    
    if (metricsError) {
      console.error('❌ Erro ao verificar tabela de métricas:', metricsError.message);
      return;
    }
    
    if (metricsTable && metricsTable.length > 0) {
      console.log('✅ Tabela performance_metrics encontrada');
      
      // Verificar estrutura da tabela
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_schema', 'public')
        .eq('table_name', 'performance_metrics')
        .order('ordinal_position');
      
      if (columnsError) {
        console.error('❌ Erro ao verificar colunas:', columnsError.message);
      } else if (columns && columns.length > 0) {
        console.log('📋 Estrutura da tabela:');
        columns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
      }
    } else {
      console.log('⚠️ Tabela performance_metrics não encontrada');
    }
    
    // 2. Verificar funções de monitoramento
    console.log('\n📊 Verificando funções de monitoramento...');
    
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .in('routine_name', ['record_performance_metric', 'monitor_queries', 'monitor_tables', 'monitor_indexes', 'generate_performance_report']);
    
    if (functionsError) {
      console.error('❌ Erro ao verificar funções:', functionsError.message);
      return;
    }
    
    if (functions && functions.length > 0) {
      console.log('✅ Funções de monitoramento encontradas:');
      functions.forEach(func => {
        console.log(`  - ${func.routine_name}()`);
      });
    } else {
      console.log('⚠️ Nenhuma função de monitoramento encontrada');
    }
    
    // 3. Testar função de monitoramento de tabelas
    console.log('\n📊 Testando monitoramento de tabelas...');
    
    try {
      const { data: tablesData, error: tablesError } = await supabase
        .rpc('monitor_tables');
      
      if (tablesError) {
        console.error('❌ Erro ao executar monitoramento de tabelas:', tablesError.message);
      } else if (tablesData && tablesData.length > 0) {
        console.log('✅ Monitoramento de tabelas executado com sucesso');
        console.log('📋 Estatísticas das tabelas:');
        tablesData.forEach(table => {
          console.log(`  - ${table.table_name}:`);
          console.log(`    * Registros: ${table.row_count}`);
          console.log(`    * Tamanho: ${table.table_size}`);
          console.log(`    * Índices: ${table.index_size}`);
          console.log(`    * Total: ${table.total_size}`);
        });
      } else {
        console.log('ℹ️ Nenhuma estatística de tabela retornada');
      }
    } catch (error) {
      console.log('⚠️ Não foi possível testar monitoramento de tabelas');
    }
    
    // 4. Testar função de monitoramento de índices
    console.log('\n📊 Testando monitoramento de índices...');
    
    try {
      const { data: indexesData, error: indexesError } = await supabase
        .rpc('monitor_indexes');
      
      if (indexesError) {
        console.error('❌ Erro ao executar monitoramento de índices:', indexesError.message);
      } else if (indexesData && indexesData.length > 0) {
        console.log('✅ Monitoramento de índices executado com sucesso');
        console.log('📋 Estatísticas dos índices:');
        indexesData.forEach(index => {
          console.log(`  - ${index.table_name}.${index.index_name}:`);
          console.log(`    * Tamanho: ${index.index_size}`);
          console.log(`    * Uso: ${index.index_usage}`);
          console.log(`    * Scans: ${index.index_scans}`);
        });
      } else {
        console.log('ℹ️ Nenhuma estatística de índice retornada');
      }
    } catch (error) {
      console.log('⚠️ Não foi possível testar monitoramento de índices');
    }
    
    // 5. Testar função de relatório de performance
    console.log('\n📊 Testando relatório de performance...');
    
    try {
      const { data: reportData, error: reportError } = await supabase
        .rpc('generate_performance_report');
      
      if (reportError) {
        console.error('❌ Erro ao executar relatório de performance:', reportError.message);
      } else if (reportData && reportData.length > 0) {
        console.log('✅ Relatório de performance executado com sucesso');
        console.log('📋 Relatório:');
        reportData.forEach(report => {
          console.log(`  - ${report.report_section}:`);
          console.log(`    * ${report.metric_name}: ${report.metric_value}`);
          console.log(`    * Recomendação: ${report.recommendation}`);
        });
      } else {
        console.log('ℹ️ Nenhum relatório retornado');
      }
    } catch (error) {
      console.log('⚠️ Não foi possível testar relatório de performance');
    }
    
    // 6. Testar registro de métrica
    console.log('\n📊 Testando registro de métrica...');
    
    try {
      const { data: metricResult, error: metricError } = await supabase
        .rpc('record_performance_metric', {
          p_metric_name: 'test_metric',
          p_metric_value: 123.45,
          p_metric_unit: 'ms',
          p_table_name: 'test_table',
          p_operation_type: 'SELECT',
          p_execution_time_ms: 123.45
        });
      
      if (metricError) {
        console.error('❌ Erro ao registrar métrica:', metricError.message);
      } else {
        console.log('✅ Métrica registrada com sucesso');
        
        // Verificar se a métrica foi salva
        const { data: savedMetrics, error: savedError } = await supabase
          .from('performance_metrics')
          .select('*')
          .eq('metric_name', 'test_metric')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (savedError) {
          console.error('❌ Erro ao verificar métrica salva:', savedError.message);
        } else if (savedMetrics && savedMetrics.length > 0) {
          console.log('✅ Métrica salva e verificada');
        }
      }
    } catch (error) {
      console.log('⚠️ Não foi possível testar registro de métrica');
    }
    
    console.log('\n🎉 Verificação de monitoramento concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
verifyMonitoring().catch(console.error);

