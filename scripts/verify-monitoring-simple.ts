import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function verifyMonitoringSimple() {
  console.log('📊 Verificando monitoramento de performance (método simplificado)...');
  
  try {
    // 1. Verificar se a tabela de métricas existe
    console.log('\n📊 Verificando tabela de métricas...');
    
    try {
      const { data: metricsData, error: metricsError } = await supabase
        .from('performance_metrics')
        .select('metric_name, metric_value, metric_unit, table_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (metricsError) {
        console.log('❌ Tabela performance_metrics não encontrada:', metricsError.message);
      } else {
        console.log('✅ Tabela performance_metrics encontrada');
        if (metricsData && metricsData.length > 0) {
          console.log('📋 Últimas métricas:');
          metricsData.forEach(metric => {
            console.log(`  - ${metric.metric_name}: ${metric.metric_value} ${metric.metric_unit || ''} (${metric.table_name || 'N/A'})`);
          });
        } else {
          console.log('ℹ️ Nenhuma métrica encontrada ainda');
        }
      }
    } catch (error) {
      console.log('❌ Erro ao verificar tabela de métricas:', error);
    }
    
    // 2. Testar função de registro de métrica
    console.log('\n📊 Testando função de registro de métrica...');
    
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
        console.log('❌ Erro ao registrar métrica:', metricError.message);
      } else {
        console.log('✅ Métrica registrada com sucesso');
        console.log('📊 Resultado:', metricResult);
        
        // Verificar se a métrica foi salva
        const { data: savedMetrics, error: savedError } = await supabase
          .from('performance_metrics')
          .select('*')
          .eq('metric_name', 'test_metric')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (savedError) {
          console.log('❌ Erro ao verificar métrica salva:', savedError.message);
        } else if (savedMetrics && savedMetrics.length > 0) {
          console.log('✅ Métrica salva e verificada');
          console.log('📊 Dados salvos:', savedMetrics[0]);
        }
      }
    } catch (error) {
      console.log('❌ Erro ao testar registro de métrica:', error);
    }
    
    // 3. Testar função de monitoramento de tabelas
    console.log('\n📊 Testando monitoramento de tabelas...');
    
    try {
      const { data: tablesData, error: tablesError } = await supabase
        .rpc('monitor_tables');
      
      if (tablesError) {
        console.log('❌ Erro ao executar monitoramento de tabelas:', tablesError.message);
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
      console.log('❌ Erro ao testar monitoramento de tabelas:', error);
    }
    
    // 4. Testar função de monitoramento de índices
    console.log('\n📊 Testando monitoramento de índices...');
    
    try {
      const { data: indexesData, error: indexesError } = await supabase
        .rpc('monitor_indexes');
      
      if (indexesError) {
        console.log('❌ Erro ao executar monitoramento de índices:', indexesError.message);
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
      console.log('❌ Erro ao testar monitoramento de índices:', error);
    }
    
    // 5. Testar função de relatório de performance
    console.log('\n📊 Testando relatório de performance...');
    
    try {
      const { data: reportData, error: reportError } = await supabase
        .rpc('generate_performance_report');
      
      if (reportError) {
        console.log('❌ Erro ao executar relatório de performance:', reportError.message);
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
      console.log('❌ Erro ao testar relatório de performance:', error);
    }
    
    // 6. Testar função de monitoramento de queries
    console.log('\n📊 Testando monitoramento de queries...');
    
    try {
      const { data: queriesData, error: queriesError } = await supabase
        .rpc('monitor_queries');
      
      if (queriesError) {
        console.log('❌ Erro ao executar monitoramento de queries:', queriesError.message);
      } else if (queriesData && queriesData.length > 0) {
        console.log('✅ Monitoramento de queries executado com sucesso');
        console.log('📋 Estatísticas de queries:');
        queriesData.forEach(query => {
          console.log(`  - Query: ${query.query_text}`);
          console.log(`    * Chamadas: ${query.calls}`);
          console.log(`    * Tempo total: ${query.total_time}ms`);
          console.log(`    * Tempo médio: ${query.mean_time}ms`);
        });
      } else {
        console.log('ℹ️ Nenhuma estatística de query retornada');
      }
    } catch (error) {
      console.log('❌ Erro ao testar monitoramento de queries:', error);
    }
    
    console.log('\n🎉 Verificação de monitoramento concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
verifyMonitoringSimple().catch(console.error);



