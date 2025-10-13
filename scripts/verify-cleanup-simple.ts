import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function verifyCleanupSimple() {
  console.log('🧹 Verificando limpeza automática (método simplificado)...');
  
  try {
    // 1. Verificar se a tabela de logs existe
    console.log('\n📊 Verificando tabela de logs...');
    
    try {
      const { data: logsData, error: logsError } = await supabase
        .from('system_logs')
        .select('operation, details, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (logsError) {
        console.log('❌ Tabela system_logs não encontrada:', logsError.message);
      } else {
        console.log('✅ Tabela system_logs encontrada');
        if (logsData && logsData.length > 0) {
          console.log('📋 Últimos logs:');
          logsData.forEach(log => {
            console.log(`  - ${log.operation}: ${log.details} (${log.created_at})`);
          });
        } else {
          console.log('ℹ️ Nenhum log encontrado ainda');
        }
      }
    } catch (error) {
      console.log('❌ Erro ao verificar tabela de logs:', error);
    }
    
    // 2. Testar função de limpeza
    console.log('\n📊 Testando função de limpeza...');
    
    try {
      const { data: cleanupResult, error: cleanupError } = await supabase
        .rpc('cleanup_old_data');
      
      if (cleanupError) {
        console.log('❌ Erro ao executar limpeza:', cleanupError.message);
      } else {
        console.log('✅ Função de limpeza executada com sucesso');
        console.log('📊 Resultado:', cleanupResult);
      }
    } catch (error) {
      console.log('❌ Erro ao testar função de limpeza:', error);
    }
    
    // 3. Testar função de otimização
    console.log('\n📊 Testando função de otimização...');
    
    try {
      const { data: optimizeResult, error: optimizeError } = await supabase
        .rpc('optimize_indexes');
      
      if (optimizeError) {
        console.log('❌ Erro ao executar otimização:', optimizeError.message);
      } else {
        console.log('✅ Função de otimização executada com sucesso');
        console.log('📊 Resultado:', optimizeResult);
      }
    } catch (error) {
      console.log('❌ Erro ao testar função de otimização:', error);
    }
    
    // 4. Testar função de monitoramento
    console.log('\n📊 Testando função de monitoramento...');
    
    try {
      const { data: monitorResult, error: monitorError } = await supabase
        .rpc('monitor_performance');
      
      if (monitorError) {
        console.log('❌ Erro ao executar monitoramento:', monitorError.message);
      } else if (monitorResult && monitorResult.length > 0) {
        console.log('✅ Função de monitoramento executada com sucesso');
        console.log('📋 Estatísticas das tabelas:');
        monitorResult.forEach(table => {
          console.log(`  - ${table.table_name}: ${table.row_count} registros, ${table.table_size}`);
        });
      } else {
        console.log('ℹ️ Nenhuma estatística retornada');
      }
    } catch (error) {
      console.log('❌ Erro ao testar função de monitoramento:', error);
    }
    
    // 5. Testar função de limpeza diária
    console.log('\n📊 Testando função de limpeza diária...');
    
    try {
      const { data: dailyResult, error: dailyError } = await supabase
        .rpc('daily_cleanup');
      
      if (dailyError) {
        console.log('❌ Erro ao executar limpeza diária:', dailyError.message);
      } else {
        console.log('✅ Função de limpeza diária executada com sucesso');
        console.log('📊 Resultado:', dailyResult);
      }
    } catch (error) {
      console.log('❌ Erro ao testar função de limpeza diária:', error);
    }
    
    // 6. Verificar se as funções foram registradas nos logs
    console.log('\n📊 Verificando logs de execução...');
    
    try {
      const { data: recentLogs, error: recentLogsError } = await supabase
        .from('system_logs')
        .select('operation, details, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (recentLogsError) {
        console.log('❌ Erro ao verificar logs recentes:', recentLogsError.message);
      } else if (recentLogs && recentLogs.length > 0) {
        console.log('📋 Logs recentes:');
        recentLogs.forEach(log => {
          console.log(`  - ${log.operation}: ${log.details} (${log.created_at})`);
        });
      } else {
        console.log('ℹ️ Nenhum log recente encontrado');
      }
    } catch (error) {
      console.log('❌ Erro ao verificar logs recentes:', error);
    }
    
    console.log('\n🎉 Verificação de limpeza automática concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
verifyCleanupSimple().catch(console.error);



