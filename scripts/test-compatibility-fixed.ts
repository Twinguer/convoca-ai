import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

interface CompatibilityTest {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
  result?: any;
}

async function testCompatibilityFixed(): Promise<CompatibilityTest[]> {
  console.log('🧪 Testando compatibilidade da nova estrutura (versão corrigida)...');
  
  const tests: CompatibilityTest[] = [];

  // Teste 1: Buscar rankings básicos
  const test1 = await runTest('Buscar rankings básicos', async () => {
    const { data, error } = await supabase
      .from('rankings')
      .select('id, titulo, orgao, banca, exam_type, status, total_participants')
      .limit(10);
    
    if (error) throw error;
    return data;
  });
  tests.push(test1);

  // Teste 2: Buscar rankings com participantes (usando abordagem separada)
  const test2 = await runTest('Buscar rankings com participantes', async () => {
    // Buscar rankings primeiro
    const { data: rankings, error: rankingsError } = await supabase
      .from('rankings')
      .select('id, titulo, total_participants')
      .limit(5);
    
    if (rankingsError) throw rankingsError;
    
    // Buscar participações para cada ranking
    const rankingsWithParticipants = [];
    for (const ranking of rankings || []) {
      const { data: participations, error: partError } = await supabase
        .from('user_rankings')
        .select('id, user_id, score, position')
        .eq('ranking_id', ranking.id);
      
      if (partError) throw partError;
      
      rankingsWithParticipants.push({
        ...ranking,
        participations: participations || []
      });
    }
    
    return rankingsWithParticipants;
  });
  tests.push(test2);

  // Teste 3: Buscar ranking específico com todos os dados (usando abordagem separada)
  const test3 = await runTest('Buscar ranking específico com todos os dados', async () => {
    const rankingId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    
    // Buscar ranking principal
    const { data: ranking, error: rankingError } = await supabase
      .from('rankings')
      .select('*')
      .eq('id', rankingId)
      .single();
    
    if (rankingError) throw rankingError;
    
    // Buscar dados relacionados separadamente
    const { data: participations, error: partError } = await supabase
      .from('user_rankings')
      .select(`
        id,
        user_id,
        score,
        position,
        reservation_type,
        users_profiles!fk_user_rankings_user_profile(
          id,
          name,
          email
        )
      `)
      .eq('ranking_id', rankingId);
    
    const { data: disciplines, error: discError } = await supabase
      .from('ranking_disciplines')
      .select('*')
      .eq('ranking_id', rankingId);
    
    const { data: answers, error: ansError } = await supabase
      .from('ranking_answers')
      .select('*')
      .eq('ranking_id', rankingId);
    
    if (partError) throw partError;
    if (discError) throw discError;
    if (ansError) throw ansError;
    
    return {
      ...ranking,
      participations: participations || [],
      disciplines: disciplines || [],
      answers: answers || []
    };
  });
  tests.push(test3);

  // Teste 4: Buscar usuários com participações (usando abordagem separada)
  const test4 = await runTest('Buscar usuários com participações', async () => {
    // Buscar usuários primeiro
    const { data: users, error: usersError } = await supabase
      .from('users_profiles')
      .select('id, name, email')
      .limit(5);
    
    if (usersError) throw usersError;
    
    // Buscar participações para cada usuário
    const usersWithParticipations = [];
    for (const user of users || []) {
      const { data: participations, error: partError } = await supabase
        .from('user_rankings')
        .select(`
          id,
          ranking_id,
          score,
          position,
          reservation_type,
          rankings!fk_user_rankings_ranking(
            id,
            titulo,
            status
          )
        `)
        .eq('user_id', user.id);
      
      if (partError) throw partError;
      
      usersWithParticipations.push({
        ...user,
        participations: participations || []
      });
    }
    
    return usersWithParticipations;
  });
  tests.push(test4);

  // Teste 5: Buscar respostas de usuário (usando abordagem separada)
  const test5 = await runTest('Buscar respostas de usuário', async () => {
    // Buscar respostas primeiro
    const { data: answers, error: answersError } = await supabase
      .from('user_answers')
      .select('id, ranking_id, user_id, booklet_id, question_number, user_answer, is_correct, points_earned')
      .limit(10);
    
    if (answersError) throw answersError;
    
    // Buscar dados relacionados para cada resposta
    const answersWithDetails = [];
    for (const answer of answers || []) {
      const { data: user, error: userError } = await supabase
        .from('users_profiles')
        .select('id, name')
        .eq('id', answer.user_id)
        .single();
      
      const { data: ranking, error: rankError } = await supabase
        .from('rankings')
        .select('id, titulo')
        .eq('id', answer.ranking_id)
        .single();
      
      if (userError) throw userError;
      if (rankError) throw rankError;
      
      answersWithDetails.push({
        ...answer,
        user: user,
        ranking: ranking
      });
    }
    
    return answersWithDetails;
  });
  tests.push(test5);

  // Teste 6: Buscar gabarito oficial
  const test6 = await runTest('Buscar gabarito oficial', async () => {
    const { data, error } = await supabase
      .from('ranking_answers')
      .select('id, ranking_id, booklet_id, question_number, correct_answer, weight')
      .eq('ranking_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      .order('question_number');
    
    if (error) throw error;
    return data;
  });
  tests.push(test6);

  // Teste 7: Buscar disciplinas
  const test7 = await runTest('Buscar disciplinas', async () => {
    const { data, error } = await supabase
      .from('ranking_disciplines')
      .select('id, ranking_id, discipline_id, discipline_name, total_questions, weight, minimum_score')
      .eq('ranking_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    
    if (error) throw error;
    return data;
  });
  tests.push(test7);

  // Teste 8: Query complexa - ranking com estatísticas (usando abordagem separada)
  const test8 = await runTest('Query complexa - ranking com estatísticas', async () => {
    const rankingId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    
    // Buscar ranking principal
    const { data: ranking, error: rankingError } = await supabase
      .from('rankings')
      .select('id, titulo, total_participants, status')
      .eq('id', rankingId)
      .single();
    
    if (rankingError) throw rankingError;
    
    // Buscar participações para estatísticas
    const { data: participations, error: partError } = await supabase
      .from('user_rankings')
      .select(`
        id,
        score,
        position,
        users_profiles!fk_user_rankings_user_profile(
          id,
          name
        )
      `)
      .eq('ranking_id', rankingId);
    
    const { data: disciplines, error: discError } = await supabase
      .from('ranking_disciplines')
      .select('discipline_name, total_questions, weight')
      .eq('ranking_id', rankingId);
    
    if (partError) throw partError;
    if (discError) throw discError;
    
    // Calcular estatísticas
    let statistics = {};
    if (participations && participations.length > 0) {
      const scores = participations.map(p => p.score);
      statistics = {
        averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        maxScore: Math.max(...scores),
        minScore: Math.min(...scores),
        totalParticipants: participations.length
      };
    }
    
    return {
      ...ranking,
      participations: participations || [],
      disciplines: disciplines || [],
      statistics
    };
  });
  tests.push(test8);

  // Teste 9: Performance - query com muitos registros
  const test9 = await runTest('Performance - query com muitos registros', async () => {
    const { data, error } = await supabase
      .from('user_rankings')
      .select('id, ranking_id, user_id, score, position')
      .order('score', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    return data;
  });
  tests.push(test9);

  // Teste 10: Validação de constraints
  const test10 = await runTest('Validação de constraints', async () => {
    // Testar inserção de dados válidos
    const testData = {
      titulo: 'Teste de Constraints',
      orgao: 'INEP',
      banca: 'INEP',
      status: 'Ativo',
      exam_type: 'Alternativas',
      has_minimum_score: false,
      total_minimum_score: 0,
      total_participants: 0,
      wrong_answer_penalty: 0.25,
      descricao: 'Teste de validação de constraints'
    };
    
    const { data, error } = await supabase
      .from('rankings')
      .insert(testData)
      .select();
    
    if (error) throw error;
    
    // Limpar dados de teste
    if (data && data.length > 0) {
      await supabase
        .from('rankings')
        .delete()
        .eq('id', data[0].id);
    }
    
    return data;
  });
  tests.push(test10);

  return tests;
}

async function runTest(name: string, testFn: () => Promise<any>): Promise<CompatibilityTest> {
  const startTime = performance.now();
  
  try {
    const result = await testFn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`✅ ${name} (${duration.toFixed(2)}ms)`);
    return {
      name,
      passed: true,
      duration,
      result
    };
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`❌ ${name} (${duration.toFixed(2)}ms)`);
    console.log(`   Erro: ${error}`);
    
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration
    };
  }
}

// Executar testes
testCompatibilityFixed().then(tests => {
  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;
  const totalTime = tests.reduce((sum, t) => sum + t.duration, 0);
  
  console.log('\n🎉 Testes de compatibilidade concluídos!');
  console.log('============================================================');
  console.log(`✅ Testes aprovados: ${passed}/${tests.length}`);
  console.log(`❌ Testes falharam: ${failed}/${tests.length}`);
  console.log(`⏱️ Tempo total: ${totalTime.toFixed(2)}ms`);
  console.log('============================================================');
  
  if (failed > 0) {
    console.log('\n⚠️ Alguns testes falharam. Verifique os erros acima.');
  } else {
    console.log('\n🎉 Todos os testes passaram! Sistema 100% funcional!');
  }
}).catch(console.error);



