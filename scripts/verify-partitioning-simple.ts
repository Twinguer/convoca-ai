import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function verifyPartitioningSimple() {
  console.log('🔍 Verificando particionamento (método simplificado)...');
  
  try {
    // 1. Testar se as tabelas particionadas existem tentando acessá-las
    console.log('\n📊 Testando tabelas particionadas...');
    
    // Testar user_rankings_partitioned
    try {
      const { data: rankingsData, error: rankingsError } = await supabase
        .from('user_rankings_partitioned')
        .select('count', { count: 'exact', head: true });
      
      if (rankingsError) {
        console.log('❌ Tabela user_rankings_partitioned não encontrada ou com erro:', rankingsError.message);
      } else {
        console.log('✅ Tabela user_rankings_partitioned encontrada');
        console.log(`📊 Registros: ${rankingsData || 0}`);
      }
    } catch (error) {
      console.log('❌ Erro ao acessar user_rankings_partitioned:', error);
    }
    
    // Testar user_answers_partitioned
    try {
      const { data: answersData, error: answersError } = await supabase
        .from('user_answers_partitioned')
        .select('count', { count: 'exact', head: true });
      
      if (answersError) {
        console.log('❌ Tabela user_answers_partitioned não encontrada ou com erro:', answersError.message);
      } else {
        console.log('✅ Tabela user_answers_partitioned encontrada');
        console.log(`📊 Registros: ${answersData || 0}`);
      }
    } catch (error) {
      console.log('❌ Erro ao acessar user_answers_partitioned:', error);
    }
    
    // 2. Testar partições específicas
    console.log('\n📊 Testando partições...');
    
    const partitions = ['user_rankings_p0', 'user_rankings_p1', 'user_rankings_p2', 'user_rankings_p3'];
    
    for (const partition of partitions) {
      try {
        const { data, error } = await supabase
          .from(partition)
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ Partição ${partition} não encontrada:`, error.message);
        } else {
          console.log(`✅ Partição ${partition} encontrada (${data || 0} registros)`);
        }
      } catch (error) {
        console.log(`❌ Erro ao acessar partição ${partition}:`, error);
      }
    }
    
    // 3. Testar performance básica
    console.log('\n📊 Testando performance básica...');
    
    const startTime = performance.now();
    
    try {
      const { data: testData, error: testError } = await supabase
        .from('rankings')
        .select('id, titulo, total_participants')
        .limit(10);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      if (testError) {
        console.error('❌ Erro no teste de performance:', testError.message);
      } else {
        console.log(`✅ Teste de performance executado em ${executionTime.toFixed(2)}ms`);
        console.log(`📊 Registros retornados: ${testData?.length || 0}`);
      }
    } catch (error) {
      console.log('❌ Erro no teste de performance:', error);
    }
    
    // 4. Testar inserção em tabela particionada
    console.log('\n📊 Testando inserção em tabela particionada...');
    
    try {
      const testRanking = {
        ranking_id: '00000000-0000-0000-0000-000000000001',
        user_id: '00000000-0000-0000-0000-000000000001',
        score: 100,
        position: 1,
        reservation_type: 'Ampla Concorrência'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('user_rankings_partitioned')
        .insert(testRanking)
        .select();
      
      if (insertError) {
        console.log('❌ Erro ao inserir em tabela particionada:', insertError.message);
      } else {
        console.log('✅ Inserção em tabela particionada funcionou');
        console.log(`📊 Dados inseridos: ${insertData?.length || 0} registros`);
        
        // Limpar dados de teste
        if (insertData && insertData.length > 0) {
          const { error: deleteError } = await supabase
            .from('user_rankings_partitioned')
            .delete()
            .eq('id', insertData[0].id);
          
          if (deleteError) {
            console.log('⚠️ Erro ao limpar dados de teste:', deleteError.message);
          } else {
            console.log('✅ Dados de teste removidos');
          }
        }
      }
    } catch (error) {
      console.log('❌ Erro no teste de inserção:', error);
    }
    
    console.log('\n🎉 Verificação de particionamento concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
verifyPartitioningSimple().catch(console.error);

