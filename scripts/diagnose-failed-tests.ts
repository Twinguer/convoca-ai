import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function diagnoseFailedTests() {
  console.log('🔍 Diagnosticando testes falhados...');
  
  try {
    // 1. Teste 4: Buscar usuários com participações
    console.log('\n📊 Teste 4: Buscar usuários com participações');
    
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users_profiles')
        .select(`
          id,
          name,
          user_rankings!inner(
            id,
            ranking_id,
            score,
            position
          )
        `)
        .limit(5);
      
      if (usersError) {
        console.log('❌ Erro no teste 4:', usersError.message);
        console.log('🔍 Detalhes do erro:', usersError);
      } else {
        console.log('✅ Teste 4 funcionando');
        console.log('📊 Dados encontrados:', usersData?.length || 0);
        if (usersData && usersData.length > 0) {
          console.log('📋 Exemplo de dados:', usersData[0]);
        }
      }
    } catch (error) {
      console.log('❌ Erro no teste 4:', error);
    }
    
    // 2. Teste 5: Buscar respostas de usuário
    console.log('\n📊 Teste 5: Buscar respostas de usuário');
    
    try {
      const { data: answersData, error: answersError } = await supabase
        .from('user_answers')
        .select(`
          id,
          ranking_id,
          user_id,
          booklet_id,
          question_number,
          user_answer,
          is_correct,
          points_earned
        `)
        .limit(5);
      
      if (answersError) {
        console.log('❌ Erro no teste 5:', answersError.message);
        console.log('🔍 Detalhes do erro:', answersError);
      } else {
        console.log('✅ Teste 5 funcionando');
        console.log('📊 Dados encontrados:', answersData?.length || 0);
        if (answersData && answersData.length > 0) {
          console.log('📋 Exemplo de dados:', answersData[0]);
        }
      }
    } catch (error) {
      console.log('❌ Erro no teste 5:', error);
    }
    
    // 3. Teste 9: Performance - query com muitos registros
    console.log('\n📊 Teste 9: Performance - query com muitos registros');
    
    try {
      const startTime = performance.now();
      
      const { data: performanceData, error: performanceError } = await supabase
        .from('user_rankings')
        .select(`
          id,
          ranking_id,
          user_id,
          score,
          position,
          users_profiles!inner(
            id,
            name
          )
        `)
        .order('score', { ascending: false })
        .limit(100);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      if (performanceError) {
        console.log('❌ Erro no teste 9:', performanceError.message);
        console.log('🔍 Detalhes do erro:', performanceError);
      } else {
        console.log('✅ Teste 9 funcionando');
        console.log(`⏱️ Tempo de execução: ${executionTime.toFixed(2)}ms`);
        console.log('📊 Dados encontrados:', performanceData?.length || 0);
      }
    } catch (error) {
      console.log('❌ Erro no teste 9:', error);
    }
    
    // 4. Verificar estrutura das tabelas
    console.log('\n📊 Verificando estrutura das tabelas...');
    
    const tables = ['users_profiles', 'user_rankings', 'user_answers', 'rankings'];
    
    for (const table of tables) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (tableError) {
          console.log(`❌ Erro na tabela ${table}:`, tableError.message);
        } else {
          console.log(`✅ Tabela ${table} acessível`);
          console.log(`📊 Registros: ${tableData?.length || 0}`);
        }
      } catch (error) {
        console.log(`❌ Erro na tabela ${table}:`, error);
      }
    }
    
    // 5. Verificar relacionamentos
    console.log('\n📊 Verificando relacionamentos...');
    
    try {
      // Verificar se há rankings
      const { data: rankingsData, error: rankingsError } = await supabase
        .from('rankings')
        .select('id, titulo')
        .limit(1);
      
      if (rankingsError) {
        console.log('❌ Erro ao buscar rankings:', rankingsError.message);
      } else if (rankingsData && rankingsData.length > 0) {
        console.log('✅ Rankings encontrados');
        console.log('📊 Exemplo:', rankingsData[0]);
        
        // Verificar participações neste ranking
        const { data: participationsData, error: participationsError } = await supabase
          .from('user_rankings')
          .select('id, user_id, score')
          .eq('ranking_id', rankingsData[0].id)
          .limit(5);
        
        if (participationsError) {
          console.log('❌ Erro ao buscar participações:', participationsError.message);
        } else {
          console.log('✅ Participações encontradas:', participationsData?.length || 0);
        }
      } else {
        console.log('⚠️ Nenhum ranking encontrado - isso pode causar falhas nos testes');
      }
    } catch (error) {
      console.log('❌ Erro ao verificar relacionamentos:', error);
    }
    
    console.log('\n🎉 Diagnóstico concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
  }
}

// Executar diagnóstico
diagnoseFailedTests().catch(console.error);



