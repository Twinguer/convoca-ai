import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function checkConstraints() {
  console.log('🔍 Verificando constraints existentes...');
  
  try {
    // Verificar constraints na tabela user_rankings
    console.log('\n📊 Constraints em user_rankings:');
    
    const { data: userRankingsConstraints, error: userRankingsError } = await supabase
      .rpc('get_table_constraints', { table_name: 'user_rankings' });
    
    if (userRankingsError) {
      console.log('❌ Erro ao buscar constraints de user_rankings:', userRankingsError.message);
    } else {
      console.log('✅ Constraints encontradas:', userRankingsConstraints?.length || 0);
      if (userRankingsConstraints && userRankingsConstraints.length > 0) {
        userRankingsConstraints.forEach(constraint => {
          console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`);
        });
      }
    }
    
    // Verificar constraints na tabela user_answers
    console.log('\n📊 Constraints em user_answers:');
    
    const { data: userAnswersConstraints, error: userAnswersError } = await supabase
      .rpc('get_table_constraints', { table_name: 'user_answers' });
    
    if (userAnswersError) {
      console.log('❌ Erro ao buscar constraints de user_answers:', userAnswersError.message);
    } else {
      console.log('✅ Constraints encontradas:', userAnswersConstraints?.length || 0);
      if (userAnswersConstraints && userAnswersConstraints.length > 0) {
        userAnswersConstraints.forEach(constraint => {
          console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`);
        });
      }
    }
    
    // Verificar constraints usando query direta
    console.log('\n📊 Verificando constraints via query direta...');
    
    const { data: constraintsData, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type, table_name')
      .in('table_name', ['user_rankings', 'user_answers'])
      .eq('constraint_type', 'FOREIGN KEY');
    
    if (constraintsError) {
      console.log('❌ Erro ao buscar constraints via query direta:', constraintsError.message);
    } else {
      console.log('✅ Constraints de foreign key encontradas:', constraintsData?.length || 0);
      if (constraintsData && constraintsData.length > 0) {
        constraintsData.forEach(constraint => {
          console.log(`  - ${constraint.table_name}: ${constraint.constraint_name}`);
        });
      }
    }
    
    // Tentar inserir dados de teste para identificar constraint específica
    console.log('\n🧪 Testando inserção para identificar constraint...');
    
    try {
      const { data: testInsert, error: testError } = await supabase
        .from('user_rankings')
        .insert({
          ranking_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          user_id: '50d2ba4b-67e5-486c-9a0f-eea78c5b0f1d',
          score: 800,
          position: 1,
          reservation_type: 'Ampla Concorrência'
        })
        .select();
      
      if (testError) {
        console.log('❌ Erro na inserção de teste:', testError.message);
        console.log('🔍 Detalhes do erro:', JSON.stringify(testError, null, 2));
      } else {
        console.log('✅ Inserção de teste funcionou!');
      }
    } catch (error) {
      console.log('❌ Erro na inserção de teste:', error);
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
checkConstraints().catch(console.error);



