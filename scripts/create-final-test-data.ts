import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function createFinalTestData() {
  console.log('🧪 Criando dados de teste finais...');
  
  try {
    // 1. Criar ranking com todos os campos obrigatórios
    console.log('\n🏆 Criando ranking completo...');
    
    const testRanking = {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      titulo: 'Simulado ENEM 2024 - Teste',
      descricao: 'Simulado para teste da nova estrutura',
      orgao: 'INEP',
      banca: 'INEP',
      status: 'Ativo',
      total_participants: 0,
      has_minimum_score: true,
      total_minimum_score: 450,
      wrong_answer_penalty: 0.25,
      created_by: '11111111-1111-1111-1111-111111111111'
    };
    
    const { data: rankingData, error: rankingError } = await supabase
      .from('rankings')
      .insert(testRanking)
      .select();
    
    if (rankingError) {
      console.log('❌ Erro ao criar ranking:', rankingError.message);
      console.log('🔍 Detalhes:', rankingError);
      return;
    } else {
      console.log('✅ Ranking criado com sucesso');
      console.log('📊 ID do ranking:', rankingData[0].id);
    }
    
    // 2. Criar disciplinas do ranking
    console.log('\n📚 Criando disciplinas do ranking...');
    
    const testDisciplines = [
      {
        ranking_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        discipline_id: 'matematica',
        discipline_name: 'Matemática',
        total_questions: 45,
        weight: 1.0,
        minimum_score: 450
      },
      {
        ranking_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        discipline_id: 'portugues',
        discipline_name: 'Português',
        total_questions: 45,
        weight: 1.0,
        minimum_score: 450
      },
      {
        ranking_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        discipline_id: 'ciencias',
        discipline_name: 'Ciências da Natureza',
        total_questions: 45,
        weight: 1.0,
        minimum_score: 450
      }
    ];
    
    for (const discipline of testDisciplines) {
      const { data, error } = await supabase
        .from('ranking_disciplines')
        .insert(discipline)
        .select();
      
      if (error) {
        console.log(`❌ Erro ao criar disciplina ${discipline.discipline_name}:`, error.message);
      } else {
        console.log(`✅ Disciplina ${discipline.discipline_name} criada`);
      }
    }
    
    // 3. Criar gabarito oficial
    console.log('\n📝 Criando gabarito oficial...');
    
    const testAnswers = [];
    for (let i = 1; i <= 10; i++) { // 10 questões para teste
      testAnswers.push({
        ranking_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        booklet_id: 'AZUL',
        question_number: i,
        correct_answer: ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)],
        weight: 1.0
      });
    }
    
    for (const answer of testAnswers) {
      const { data, error } = await supabase
        .from('ranking_answers')
        .insert(answer)
        .select();
      
      if (error) {
        console.log(`❌ Erro ao criar resposta ${answer.question_number}:`, error.message);
      }
    }
    console.log('✅ Gabarito oficial criado (10 questões)');
    
    // 4. Criar participações de usuários
    console.log('\n👤 Criando participações de usuários...');
    
    const testParticipations = [
      {
        ranking_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        user_id: '11111111-1111-1111-1111-111111111111',
        score: 750.5,
        position: 1,
        reservation_type: 'Ampla Concorrência'
      },
      {
        ranking_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        user_id: '22222222-2222-2222-2222-222222222222',
        score: 720.0,
        position: 2,
        reservation_type: 'Ampla Concorrência'
      },
      {
        ranking_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        user_id: '33333333-3333-3333-3333-333333333333',
        score: 680.25,
        position: 3,
        reservation_type: 'Ampla Concorrência'
      }
    ];
    
    for (const participation of testParticipations) {
      const { data, error } = await supabase
        .from('user_rankings')
        .insert(participation)
        .select();
      
      if (error) {
        console.log(`❌ Erro ao criar participação ${participation.user_id}:`, error.message);
      } else {
        console.log(`✅ Participação ${participation.user_id} criada`);
      }
    }
    
    // 5. Criar respostas dos usuários
    console.log('\n📋 Criando respostas dos usuários...');
    
    const testUserAnswers = [];
    for (const participation of testParticipations) {
      for (let i = 1; i <= 5; i++) { // 5 respostas por usuário
        testUserAnswers.push({
          ranking_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          user_id: participation.user_id,
          booklet_id: 'AZUL',
          question_number: i,
          user_answer: ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)],
          is_correct: Math.random() > 0.3, // 70% de acerto
          points_earned: Math.random() > 0.3 ? 1.0 : 0
        });
      }
    }
    
    for (const answer of testUserAnswers) {
      const { data, error } = await supabase
        .from('user_answers')
        .insert(answer)
        .select();
      
      if (error) {
        console.log(`❌ Erro ao criar resposta do usuário:`, error.message);
      }
    }
    console.log('✅ Respostas dos usuários criadas');
    
    // 6. Atualizar contador de participantes
    console.log('\n📊 Atualizando contador de participantes...');
    
    const { data: updateData, error: updateError } = await supabase
      .from('rankings')
      .update({ total_participants: 3 })
      .eq('id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    
    if (updateError) {
      console.log('❌ Erro ao atualizar contador:', updateError.message);
    } else {
      console.log('✅ Contador de participantes atualizado');
    }
    
    console.log('\n🎉 Dados de teste finais criados com sucesso!');
    console.log('\n📊 Resumo dos dados criados:');
    console.log('- 1 ranking (Simulado ENEM 2024)');
    console.log('- 3 disciplinas');
    console.log('- 10 questões no gabarito');
    console.log('- 3 participações');
    console.log('- 15 respostas de usuários');
    
    // 7. Executar teste de compatibilidade
    console.log('\n🧪 Executando teste de compatibilidade...');
    
    const { data: testData, error: testError } = await supabase
      .from('rankings')
      .select(`
        id,
        titulo,
        total_participants,
        user_rankings!inner(
          id,
          user_id,
          score,
          position,
          users_profiles!inner(
            id,
            name
          )
        )
      `)
      .eq('id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    
    if (testError) {
      console.log('❌ Erro no teste de compatibilidade:', testError.message);
    } else {
      console.log('✅ Teste de compatibilidade passou');
      console.log('📊 Dados retornados:', testData?.length || 0);
      if (testData && testData.length > 0) {
        console.log('📋 Ranking encontrado:', testData[0].titulo);
        console.log('👥 Participações:', testData[0].user_rankings?.length || 0);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante criação de dados de teste:', error);
  }
}

// Executar criação de dados
createFinalTestData().catch(console.error);



