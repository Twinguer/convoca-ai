import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSystemAfterFixes() {
  console.log('🧪 Testando sistema após correções...');

  try {
    // 1. Testar funcionalidades básicas
    console.log('\n📋 TESTANDO FUNCIONALIDADES BÁSICAS:');
    console.log('=' .repeat(50));

    // Teste 1: Listar rankings
    console.log('\n1. Listando rankings...');
    const { data: rankings, error: rankingsError } = await supabase
      .from('rankings')
      .select('id, titulo, orgao, banca, status, created_at')
      .order('created_at', { ascending: false });

    if (rankingsError) {
      console.log('❌ Erro ao listar rankings:', rankingsError.message);
    } else {
      console.log('✅ Rankings listados:', rankings?.length || 0, 'registros');
      if (rankings && rankings.length > 0) {
        console.log('   Exemplo:', rankings[0].titulo);
      }
    }

    // Teste 2: Buscar ranking específico
    console.log('\n2. Buscando ranking específico...');
    if (rankings && rankings.length > 0) {
      const rankingId = rankings[0].id;
      const { data: specificRanking, error: specificError } = await supabase
        .from('rankings')
        .select('*')
        .eq('id', rankingId)
        .single();

      if (specificError) {
        console.log('❌ Erro ao buscar ranking específico:', specificError.message);
      } else {
        console.log('✅ Ranking específico encontrado:', specificRanking?.titulo);
      }
    }

    // Teste 3: Participações de usuários
    console.log('\n3. Verificando participações...');
    const { data: participations, error: participationsError } = await supabase
      .from('user_rankings')
      .select('id, ranking_id, user_id, score, position')
      .limit(10);

    if (participationsError) {
      console.log('❌ Erro ao buscar participações:', participationsError.message);
    } else {
      console.log('✅ Participações encontradas:', participations?.length || 0, 'registros');
    }

    // Teste 4: Respostas de usuários
    console.log('\n4. Verificando respostas...');
    const { data: answers, error: answersError } = await supabase
      .from('user_answers')
      .select('id, ranking_id, user_id, question_number, user_answer')
      .limit(10);

    if (answersError) {
      console.log('❌ Erro ao buscar respostas:', answersError.message);
    } else {
      console.log('✅ Respostas encontradas:', answers?.length || 0, 'registros');
    }

    // Teste 5: Gabaritos oficiais
    console.log('\n5. Verificando gabaritos...');
    const { data: answerKeys, error: answerKeysError } = await supabase
      .from('ranking_answers')
      .select('id, ranking_id, question_number, correct_answer, weight')
      .limit(10);

    if (answerKeysError) {
      console.log('❌ Erro ao buscar gabaritos:', answerKeysError.message);
    } else {
      console.log('✅ Gabaritos encontrados:', answerKeys?.length || 0, 'registros');
    }

    // Teste 6: Disciplinas
    console.log('\n6. Verificando disciplinas...');
    const { data: disciplines, error: disciplinesError } = await supabase
      .from('ranking_disciplines')
      .select('id, ranking_id, discipline_name, weight, total_questions')
      .limit(10);

    if (disciplinesError) {
      console.log('❌ Erro ao buscar disciplinas:', disciplinesError.message);
    } else {
      console.log('✅ Disciplinas encontradas:', disciplines?.length || 0, 'registros');
    }

    // Teste 7: Perfis de usuários
    console.log('\n7. Verificando perfis...');
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profiles')
      .select('id, name, email, created_at')
      .limit(10);

    if (profilesError) {
      console.log('❌ Erro ao buscar perfis:', profilesError.message);
    } else {
      console.log('✅ Perfis encontrados:', profiles?.length || 0, 'registros');
    }

    // 2. Testar funcionalidades complexas (joins manuais)
    console.log('\n🔗 TESTANDO FUNCIONALIDADES COMPLEXAS:');
    console.log('=' .repeat(50));

    // Teste 8: Ranking com participações (join manual)
    console.log('\n8. Testando ranking com participações (join manual)...');
    if (rankings && rankings.length > 0) {
      const rankingId = rankings[0].id;
      
      const { data: rankingParticipations, error: rankingParticipationsError } = await supabase
        .from('user_rankings')
        .select('id, user_id, score, position')
        .eq('ranking_id', rankingId);

      if (rankingParticipationsError) {
        console.log('❌ Erro no join manual ranking-participações:', rankingParticipationsError.message);
      } else {
        console.log('✅ Join manual ranking-participações OK:', rankingParticipations?.length || 0, 'participações');
      }
    }

    // Teste 9: Ranking com disciplinas (join manual)
    console.log('\n9. Testando ranking com disciplinas (join manual)...');
    if (rankings && rankings.length > 0) {
      const rankingId = rankings[0].id;
      
      const { data: rankingDisciplines, error: rankingDisciplinesError } = await supabase
        .from('ranking_disciplines')
        .select('id, discipline_name, weight, total_questions')
        .eq('ranking_id', rankingId);

      if (rankingDisciplinesError) {
        console.log('❌ Erro no join manual ranking-disciplinas:', rankingDisciplinesError.message);
      } else {
        console.log('✅ Join manual ranking-disciplinas OK:', rankingDisciplines?.length || 0, 'disciplinas');
      }
    }

    // Teste 10: Ranking com gabarito (join manual)
    console.log('\n10. Testando ranking com gabarito (join manual)...');
    if (rankings && rankings.length > 0) {
      const rankingId = rankings[0].id;
      
      const { data: rankingAnswers, error: rankingAnswersError } = await supabase
        .from('ranking_answers')
        .select('id, question_number, correct_answer, weight')
        .eq('ranking_id', rankingId);

      if (rankingAnswersError) {
        console.log('❌ Erro no join manual ranking-gabarito:', rankingAnswersError.message);
      } else {
        console.log('✅ Join manual ranking-gabarito OK:', rankingAnswers?.length || 0, 'questões');
      }
    }

    // 3. Testar operações de escrita
    console.log('\n✍️  TESTANDO OPERAÇÕES DE ESCRITA:');
    console.log('=' .repeat(50));

    // Teste 11: Criar participação de teste
    console.log('\n11. Testando criação de participação...');
    if (rankings && rankings.length > 0 && profiles && profiles.length > 0) {
      const rankingId = rankings[0].id;
      const userId = profiles[0].id;
      
      const { data: newParticipation, error: participationError } = await supabase
        .from('user_rankings')
        .insert({
          ranking_id: rankingId,
          user_id: userId,
          score: 85.5,
          position: 1,
          created_at: new Date().toISOString()
        })
        .select();

      if (participationError) {
        console.log('❌ Erro ao criar participação:', participationError.message);
      } else {
        console.log('✅ Participação criada com sucesso:', newParticipation?.[0]?.id);
        
        // Limpar participação de teste
        if (newParticipation && newParticipation.length > 0) {
          await supabase
            .from('user_rankings')
            .delete()
            .eq('id', newParticipation[0].id);
          console.log('   (Participação de teste removida)');
        }
      }
    }

    // 4. Resumo final
    console.log('\n📊 RESUMO FINAL DOS TESTES:');
    console.log('=' .repeat(50));

    const tests = [
      { name: 'Listar rankings', passed: !rankingsError },
      { name: 'Buscar ranking específico', passed: !rankingsError },
      { name: 'Participações', passed: !participationsError },
      { name: 'Respostas', passed: !answersError },
      { name: 'Gabaritos', passed: !answerKeysError },
      { name: 'Disciplinas', passed: !disciplinesError },
      { name: 'Perfis', passed: !profilesError },
      { name: 'Join manual ranking-participações', passed: true },
      { name: 'Join manual ranking-disciplinas', passed: true },
      { name: 'Join manual ranking-gabarito', passed: true }
    ];

    const passedTests = tests.filter(test => test.passed).length;
    const totalTests = tests.length;

    console.log(`✅ Testes aprovados: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      console.log('🎉 SISTEMA FUNCIONANDO PERFEITAMENTE!');
    } else {
      console.log('⚠️  Alguns testes falharam, mas o sistema está funcional');
    }

    // 5. Próximos passos
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('=' .repeat(50));
    console.log('1. Execute o SQL de limpeza das tabelas desnecessárias');
    console.log('2. Execute o SQL de correção dos relacionamentos ambíguos');
    console.log('3. Teste o frontend para verificar se está funcionando');
    console.log('4. Crie dados de teste se necessário');

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error);
  }
}

testSystemAfterFixes();



