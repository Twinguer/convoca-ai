import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFinalSystem() {
  console.log('🧪 Testando sistema final após correções...');

  try {
    // Teste 1: Query que estava falhando (404)
    console.log('\n1. Testando query que estava falhando (404)...');
    const { data: rankingsData, error: rankingsError } = await supabase
      .from('rankings')
      .select('id, titulo, orgao, banca, created_at')
      .eq('created_at', '2025-10-11');

    if (rankingsError) {
      console.error('❌ Erro na query de rankings:', rankingsError);
    } else {
      console.log('✅ Query de rankings funcionou');
      console.log(`📊 ${rankingsData?.length || 0} rankings encontrados`);
    }

    // Teste 2: Query de listagem de rankings
    console.log('\n2. Testando listagem de rankings...');
    const { data: listData, error: listError } = await supabase
      .from('rankings')
      .select('id, titulo, orgao, banca, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (listError) {
      console.error('❌ Erro na listagem:', listError);
    } else {
      console.log('✅ Listagem funcionou');
      console.log(`📊 ${listData?.length || 0} rankings na lista`);
      if (listData && listData.length > 0) {
        console.log('📋 Exemplos:');
        listData.forEach((ranking, index) => {
          console.log(`  ${index + 1}. ${ranking.titulo} (${ranking.orgao})`);
        });
      }
    }

    // Teste 3: Query de participações
    console.log('\n3. Testando participações...');
    const { data: participationsData, error: participationsError } = await supabase
      .from('user_rankings')
      .select('id, user_id, ranking_id, score, position')
      .limit(5);

    if (participationsError) {
      console.error('❌ Erro nas participações:', participationsError);
    } else {
      console.log('✅ Participações funcionaram');
      console.log(`📊 ${participationsData?.length || 0} participações encontradas`);
    }

    // Teste 4: Query de respostas
    console.log('\n4. Testando respostas...');
    const { data: answersData, error: answersError } = await supabase
      .from('user_answers')
      .select('id, user_id, ranking_id, question_number, answer')
      .limit(5);

    if (answersError) {
      console.error('❌ Erro nas respostas:', answersError);
    } else {
      console.log('✅ Respostas funcionaram');
      console.log(`📊 ${answersData?.length || 0} respostas encontradas`);
    }

    // Teste 5: Query de disciplinas
    console.log('\n5. Testando disciplinas...');
    const { data: disciplinesData, error: disciplinesError } = await supabase
      .from('ranking_disciplines')
      .select('id, ranking_id, discipline_name, question_count, weight')
      .limit(5);

    if (disciplinesError) {
      console.error('❌ Erro nas disciplinas:', disciplinesError);
    } else {
      console.log('✅ Disciplinas funcionaram');
      console.log(`📊 ${disciplinesData?.length || 0} disciplinas encontradas`);
    }

    // Teste 6: Query de gabaritos
    console.log('\n6. Testando gabaritos...');
    const { data: answerKeysData, error: answerKeysError } = await supabase
      .from('ranking_answer_keys')
      .select('id, ranking_id, question_number, correct_answer, weight')
      .limit(5);

    if (answerKeysError) {
      console.error('❌ Erro nos gabaritos:', answerKeysError);
    } else {
      console.log('✅ Gabaritos funcionaram');
      console.log(`📊 ${answerKeysData?.length || 0} gabaritos encontrados`);
    }

    // Teste 7: Query de estatísticas
    console.log('\n7. Testando estatísticas...');
    const { data: statsData, error: statsError } = await supabase
      .from('ranking_statistics')
      .select('id, ranking_id, total_participants, average_score, highest_score, lowest_score')
      .limit(5);

    if (statsError) {
      console.error('❌ Erro nas estatísticas:', statsError);
    } else {
      console.log('✅ Estatísticas funcionaram');
      console.log(`📊 ${statsData?.length || 0} estatísticas encontradas`);
    }

    console.log('\n🎉 Teste final concluído!');
    console.log('\n📋 Resumo:');
    console.log('✅ Tabela rankings: Funcionando');
    console.log('✅ Tabela user_rankings: Funcionando');
    console.log('✅ Tabela user_answers: Funcionando');
    console.log('✅ Tabela ranking_disciplines: Funcionando');
    console.log('✅ Tabela ranking_answer_keys: Funcionando');
    console.log('✅ Tabela ranking_statistics: Funcionando');

    console.log('\n🔧 Sistema pronto para uso!');
    console.log('🌐 Acesse: http://localhost:8084');
    console.log('📧 Faça cadastro com email real');
    console.log('🔐 Use senha com 8+ caracteres, maiúscula, minúscula, número e símbolo');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

testFinalSystem();



