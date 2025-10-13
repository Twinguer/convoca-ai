import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function createCompleteTestData() {
  console.log('🧪 Criando dados de teste completos para classificação...');
  
  try {
    // 1. Limpar dados existentes primeiro
    console.log('\n🧹 Limpando dados existentes...');
    
    await supabase.from('user_answers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('user_rankings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('ranking_answers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('ranking_disciplines').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('rankings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('✅ Dados limpos');
    
    // 2. Criar ranking principal
    console.log('\n🏆 Criando ranking principal...');
    
    const mainRanking = {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      titulo: 'Simulado ENEM 2024 - Classificação',
      descricao: 'Simulado para teste da funcionalidade de classificação',
      orgao: 'INEP',
      banca: 'INEP',
      status: 'Ativo',
      exam_type: 'Alternativas',
      has_minimum_score: true,
      total_minimum_score: 450,
      total_participants: 0,
      wrong_answer_penalty: 0.25,
      created_by: '11111111-1111-1111-1111-111111111111'
    };
    
    const { data: rankingData, error: rankingError } = await supabase
      .from('rankings')
      .insert(mainRanking)
      .select();
    
    if (rankingError) {
      console.log('❌ Erro ao criar ranking:', rankingError.message);
      return;
    } else {
      console.log('✅ Ranking principal criado');
    }
    
    // 3. Criar disciplinas
    console.log('\n📚 Criando disciplinas...');
    
    const disciplines = [
      {
        ranking_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        discipline_id: 'matematica',
        discipline_name: 'Matemática',
        total_questions: 45,
        weight: 1.0,
        minimum_score: 450
      },
      {
        ranking_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        discipline_id: 'portugues',
        discipline_name: 'Português',
        total_questions: 45,
        weight: 1.0,
        minimum_score: 450
      },
      {
        ranking_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        discipline_id: 'ciencias',
        discipline_name: 'Ciências da Natureza',
        total_questions: 45,
        weight: 1.0,
        minimum_score: 450
      }
    ];
    
    for (const discipline of disciplines) {
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
    
    // 4. Criar gabarito oficial
    console.log('\n📝 Criando gabarito oficial...');
    
    const answers = [];
    for (let i = 1; i <= 20; i++) { // 20 questões para teste
      answers.push({
        ranking_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        booklet_id: 'AZUL',
        question_number: i,
        correct_answer: ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)],
        weight: 1.0
      });
    }
    
    for (const answer of answers) {
      const { data, error } = await supabase
        .from('ranking_answers')
        .insert(answer)
        .select();
      
      if (error) {
        console.log(`❌ Erro ao criar resposta ${answer.question_number}:`, error.message);
      }
    }
    console.log('✅ Gabarito oficial criado (20 questões)');
    
    // 5. Buscar usuários existentes
    console.log('\n👥 Buscando usuários existentes...');
    
    const { data: existingUsers, error: usersError } = await supabase
      .from('users_profiles')
      .select('id, name, email')
      .limit(10);
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }
    
    console.log(`✅ ${existingUsers?.length || 0} usuários encontrados`);
    
    // 6. Criar participações para usuários existentes
    console.log('\n👤 Criando participações de usuários...');
    
    const participations = [];
    const scores = [850, 820, 780, 750, 720, 690, 660, 630, 600, 570]; // Pontuações variadas
    
    for (let i = 0; i < Math.min(existingUsers?.length || 0, 10); i++) {
      const user = existingUsers[i];
      const score = scores[i] || Math.floor(Math.random() * 200) + 400; // 400-600 pontos
      
      participations.push({
        ranking_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        user_id: user.id,
        score: score,
        position: i + 1,
        reservation_type: 'Ampla Concorrência'
      });
    }
    
    for (const participation of participations) {
      const { data, error } = await supabase
        .from('user_rankings')
        .insert(participation)
        .select();
      
      if (error) {
        console.log(`❌ Erro ao criar participação ${participation.user_id}:`, error.message);
      } else {
        console.log(`✅ Participação criada: ${participation.user_id} - ${participation.score} pontos`);
      }
    }
    
    // 7. Criar respostas dos usuários
    console.log('\n📋 Criando respostas dos usuários...');
    
    const userAnswers = [];
    for (const participation of participations) {
      for (let i = 1; i <= 10; i++) { // 10 respostas por usuário
        userAnswers.push({
          ranking_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          user_id: participation.user_id,
          booklet_id: 'AZUL',
          question_number: i,
          user_answer: ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)],
          is_correct: Math.random() > 0.3, // 70% de acerto
          points_earned: Math.random() > 0.3 ? 1.0 : 0
        });
      }
    }
    
    for (const answer of userAnswers) {
      const { data, error } = await supabase
        .from('user_answers')
        .insert(answer)
        .select();
      
      if (error) {
        console.log(`❌ Erro ao criar resposta do usuário:`, error.message);
      }
    }
    console.log('✅ Respostas dos usuários criadas');
    
    // 8. Atualizar contador de participantes
    console.log('\n📊 Atualizando contador de participantes...');
    
    const { data: updateData, error: updateError } = await supabase
      .from('rankings')
      .update({ total_participants: participations.length })
      .eq('id', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
    
    if (updateError) {
      console.log('❌ Erro ao atualizar contador:', updateError.message);
    } else {
      console.log('✅ Contador de participantes atualizado');
    }
    
    // 9. Testar classificação
    console.log('\n🧪 Testando classificação...');
    
    const { data: classificationData, error: classificationError } = await supabase
      .from('user_rankings')
      .select(`
        id,
        ranking_id,
        user_id,
        score,
        position,
        reservation_type,
        users_profiles!fk_user_rankings_user_profile(
          id,
          name,
          email
        ),
        rankings!fk_user_rankings_ranking(
          id,
          titulo,
          status
        )
      `)
      .eq('ranking_id', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
      .order('score', { ascending: false });
    
    if (classificationError) {
      console.log('❌ Erro ao testar classificação:', classificationError.message);
    } else {
      console.log('✅ Classificação funcionando!');
      console.log('📊 Participantes na classificação:', classificationData?.length || 0);
      if (classificationData && classificationData.length > 0) {
        console.log('📋 Top 5:');
        classificationData.slice(0, 5).forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.users_profiles?.name || 'Usuário sem nome'}: ${item.score} pontos`);
        });
      }
    }
    
    console.log('\n🎉 Dados de teste completos criados com sucesso!');
    console.log('\n📊 Resumo dos dados criados:');
    console.log('- 1 ranking principal (Simulado ENEM 2024)');
    console.log('- 3 disciplinas');
    console.log('- 20 questões no gabarito');
    console.log(`- ${participations.length} participações`);
    console.log(`- ${userAnswers.length} respostas de usuários`);
    
  } catch (error) {
    console.error('❌ Erro durante criação de dados:', error);
  }
}

// Executar criação de dados
createCompleteTestData().catch(console.error);



