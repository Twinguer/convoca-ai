import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function verifyCleanup() {
  console.log('🧹 Verificando limpeza automática implementada...');
  
  try {
    // 1. Verificar se as funções de limpeza existem
    console.log('\n📊 Verificando funções de limpeza...');
    
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .in('routine_name', ['cleanup_old_data', 'optimize_indexes', 'monitor_performance', 'daily_cleanup']);
    
    if (functionsError) {
      console.error('❌ Erro ao verificar funções:', functionsError.message);
      return;
    }
    
    if (functions && functions.length > 0) {
      console.log('✅ Funções de limpeza encontradas:');
      functions.forEach(func => {
        console.log(`  - ${func.routine_name}()`);
      });
    } else {
      console.log('⚠️ Nenhuma função de limpeza encontrada');
    }
    
    // 2. Verificar se a tabela de logs existe
    console.log('\n📊 Verificando tabela de logs...');
    
    const { data: logsTable, error: logsError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'system_logs');
    
    if (logsError) {
      console.error('❌ Erro ao verificar tabela de logs:', logsError.message);
      return;
    }
    
    if (logsTable && logsTable.length > 0) {
      console.log('✅ Tabela system_logs encontrada');
      
      // Verificar se há logs
      const { data: logs, error: logsDataError } = await supabase
        .from('system_logs')
        .select('operation, details, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (logsDataError) {
        console.error('❌ Erro ao verificar logs:', logsDataError.message);
      } else if (logs && logs.length > 0) {
        console.log('📋 Últimos logs:');
        logs.forEach(log => {
          console.log(`  - ${log.operation}: ${log.details} (${log.created_at})`);
        });
      } else {
        console.log('ℹ️ Nenhum log encontrado ainda');
      }
    } else {
      console.log('⚠️ Tabela system_logs não encontrada');
    }
    
    // 3. Testar função de limpeza
    console.log('\n📊 Testando função de limpeza...');
    
    try {
      const { data: cleanupResult, error: cleanupError } = await supabase
        .rpc('cleanup_old_data');
      
      if (cleanupError) {
        console.error('❌ Erro ao executar limpeza:', cleanupError.message);
      } else {
        console.log('✅ Função de limpeza executada com sucesso');
      }
    } catch (error) {
      console.log('⚠️ Não foi possível testar função de limpeza (normal se não houver dados)');
    }
    
    // 4. Testar função de monitoramento
    console.log('\n📊 Testando função de monitoramento...');
    
    try {
      const { data: monitorResult, error: monitorError } = await supabase
        .rpc('monitor_performance');
      
      if (monitorError) {
        console.error('❌ Erro ao executar monitoramento:', monitorError.message);
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
      console.log('⚠️ Não foi possível testar função de monitoramento');
    }
    
    // 5. Verificar triggers
    console.log('\n📊 Verificando triggers...');
    
    const { data: triggers, error: triggersError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_object_table')
      .eq('trigger_schema', 'public')
      .like('trigger_name', '%cleanup%');
    
    if (triggersError) {
      console.error('❌ Erro ao verificar triggers:', triggersError.message);
      return;
    }
    
    if (triggers && triggers.length > 0) {
      console.log('✅ Triggers de limpeza encontrados:');
      triggers.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name} em ${trigger.event_object_table}`);
      });
    } else {
      console.log('⚠️ Nenhum trigger de limpeza encontrado');
    }
    
    console.log('\n🎉 Verificação de limpeza automática concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
verifyCleanup().catch(console.error);



