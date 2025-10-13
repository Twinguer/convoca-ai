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

async function testCompatibility(): Promise<CompatibilityTest[]> {
  console.log('🧪 Testando compatibilidade da nova estrutura...');
  
  const tests: CompatibilityTest[] = [];

  // Teste 1: Buscar rankings básicos
  const test1 = await runTest('Buscar rankings básicos', async () => {
    const { data, error } = await supabase
      .from('rankings')
      .select('id, titulo, orgao, banca, exam_type, status')
      .limit(10);
    
    if (error) throw error;
    return data;
  });
  tests.push(test1);

  // Teste 2: Buscar rankings com participantes
  const test2 = await runTest('Buscar rankings com participantes', async () => {
    const { data, error } = await supabase
      .from('rankings')
      .select(`
        id,
        titulo,
        total_participants,
        user_rankings(count)
      `)
      .limit(5);
    
    if (error) throw error;
    return data;
  });
  tests.push(test2);

  // Teste 3: Buscar ranking específico com todos os dados
  const test3 = await runTest('Buscar ranking específico com todos os dados', async () => {
    // Primeiro, buscar um ranking existente
    const { data: rankings } = await supabase
      .from('rankings')
      .select('id')
      .limit(1);
    
    if (!rankings || rankings.length === 0) {
      return { message: 'Nenhum ranking encontrado para teste' };
    }

    const rankingId = rankings[0].id;
    const { data, error } = await supabase
      .from('rankings')
      .select(`
        *,
        user_rankings(
          id,
          user_id,
          score,
          position,
          reservation_type,
          users_profiles(name, avatar_url)
        ),
        ranking_answers(
          id,
          booklet_id,
          question_number,
          correct_answer,
          weight,
          is_nullified
        ),
        ranking_disciplines(
          id,
          discipline_id,
          discipline_name,
          minimum_score,
          weight
        )
      `)
      .eq('id', rankingId)
      .single();
    
    if (error) throw error;
    return data;
  });
  tests.push(test3);

  // Teste 4: Buscar usuários com participações
  const test4 = await runTest('Buscar usuários com participações', async () => {
    const { data, error } = await supabase
      .from('users_profiles')
      .select(`
        id,
        name,
        avatar_url,
        user_rankings(
          id,
          ranking_id,
          score,
          position,
          rankings(titulo, orgao, banca)
        )
      `)
      .limit(5);
    
    if (error) throw error;
    return data;
  });
  tests.push(test4);

  // Teste 5: Buscar respostas de usuário
  const test5 = await runTest('Buscar respostas de usuário', async () => {
    const { data, error } = await supabase
      .from('user_answers')
      .select(`
        id,
        ranking_id,
        user_id,
        booklet_id,
        question_number,
        user_answer,
        is_correct,
        points_earned,
        rankings(titulo),
        users_profiles(name)
      `)
      .limit(10);
    
    if (error) throw error;
    return data;
  });
  tests.push(test5);

  // Teste 6: Buscar gabarito oficial
  const test6 = await runTest('Buscar gabarito oficial', async () => {
    const { data, error } = await supabase
      .from('ranking_answers')
      .select(`
        id,
        ranking_id,
        booklet_id,
        question_number,
        correct_answer,
        weight,
        is_nullified,
        rankings(titulo)
      `)
      .limit(10);
    
    if (error) throw error;
    return data;
  });
  tests.push(test6);

  // Teste 7: Buscar disciplinas
  const test7 = await runTest('Buscar disciplinas', async () => {
    const { data, error } = await supabase
      .from('ranking_disciplines')
      .select(`
        id,
        ranking_id,
        discipline_id,
        discipline_name,
        minimum_score,
        weight,
        rankings(titulo)
      `)
      .limit(10);
    
    if (error) throw error;
    return data;
  });
  tests.push(test7);

  // Teste 8: Query complexa - ranking com estatísticas
  const test8 = await runTest('Query complexa - ranking com estatísticas', async () => {
    const { data, error } = await supabase
      .from('rankings')
      .select(`
        id,
        titulo,
        orgao,
        banca,
        exam_type,
        total_participants,
        user_rankings(
          score,
          position,
          reservation_type
        )
      `)
      .limit(3);
    
    if (error) throw error;
    
    // Processar estatísticas
    const processedData = data?.map(ranking => ({
      ...ranking,
      stats: {
        total_participants: ranking.user_rankings?.length || 0,
        average_score: ranking.user_rankings?.length > 0 
          ? ranking.user_rankings.reduce((sum: number, ur: any) => sum + (ur.score || 0), 0) / ranking.user_rankings.length
          : 0,
        reservation_types: [...new Set(ranking.user_rankings?.map((ur: any) => ur.reservation_type) || [])]
      }
    }));
    
    return processedData;
  });
  tests.push(test8);

  // Teste 9: Performance - query com muitos registros
  const test9 = await runTest('Performance - query com muitos registros', async () => {
    const startTime = performance.now();
    
    const { data, error } = await supabase
      .from('user_rankings')
      .select(`
        id,
        score,
        position,
        reservation_type,
        rankings(titulo, orgao),
        users_profiles(name)
      `)
      .order('score', { ascending: false })
      .limit(100);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (error) throw error;
    
    return {
      recordCount: data?.length || 0,
      duration: `${duration.toFixed(2)}ms`,
      performance: duration < 1000 ? 'Excelente' : duration < 3000 ? 'Boa' : 'Lenta'
    };
  });
  tests.push(test9);

  // Teste 10: Validação de constraints
  const test10 = await runTest('Validação de constraints', async () => {
    // Tentar inserir dados inválidos para testar constraints
    const { error: constraintError } = await supabase
      .from('user_rankings')
      .insert({
        ranking_id: '00000000-0000-0000-0000-000000000000', // UUID inválido
        user_id: '00000000-0000-0000-0000-000000000000', // UUID inválido
        score: -1 // Score negativo
      });
    
    // Esperamos que dê erro devido aos constraints
    if (constraintError) {
      return { message: 'Constraints funcionando corretamente', error: constraintError.message };
    } else {
      throw new Error('Constraints não estão funcionando - dados inválidos foram aceitos');
    }
  });
  tests.push(test10);

  // RESUMO DOS TESTES
  console.log('\n🎉 Testes de compatibilidade concluídos!');
  console.log('='.repeat(60));
  
  const passedTests = tests.filter(t => t.passed).length;
  const failedTests = tests.filter(t => !t.passed).length;
  const totalDuration = tests.reduce((sum, t) => sum + t.duration, 0);
  
  console.log(`✅ Testes aprovados: ${passedTests}/${tests.length}`);
  console.log(`❌ Testes falharam: ${failedTests}/${tests.length}`);
  console.log(`⏱️ Tempo total: ${totalDuration.toFixed(2)}ms`);
  console.log('='.repeat(60));

  // Detalhes dos testes
  tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    const duration = `${test.duration.toFixed(2)}ms`;
    console.log(`${status} ${index + 1}. ${test.name} (${duration})`);
    if (test.error) {
      console.log(`   Erro: ${test.error}`);
    }
  });

  if (failedTests > 0) {
    console.log('\n⚠️ Alguns testes falharam. Verifique os erros acima.');
  } else {
    console.log('\n🎉 Todos os testes passaram! A nova estrutura está funcionando perfeitamente.');
  }

  return tests;
}

async function runTest(name: string, testFn: () => Promise<any>): Promise<CompatibilityTest> {
  const startTime = performance.now();
  
  try {
    const result = await testFn();
    const endTime = performance.now();
    
    return {
      name,
      passed: true,
      duration: endTime - startTime,
      result
    };
  } catch (error) {
    const endTime = performance.now();
    
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: endTime - startTime
    };
  }
}

// Executar testes
testCompatibility().catch(console.error);



