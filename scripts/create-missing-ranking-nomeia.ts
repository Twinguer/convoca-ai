import { createClient } from '@supabase/supabase-js';

const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';
const nomeiaServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEzMjI2MywiZXhwIjoyMDc1NzA4MjYzfQ.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const nomeiaSupabase = createClient(nomeiaUrl, nomeiaAnonKey);
const nomeiaAdmin = createClient(nomeiaUrl, nomeiaServiceRoleKey);

const RANKING_ID = 'f2522ebf-efb5-4e4f-a543-75364c830c88';

async function createMissingRanking() {
  console.log(`🔄 Criando ranking faltante: ${RANKING_ID}`);

  try {
    // 1. Verificar se já existe
    console.log('\n📊 1. Verificando se ranking já existe...');
    const { data: existingRanking, error: checkError } = await nomeiaAdmin
      .from('rankings')
      .select('id')
      .eq('id', RANKING_ID)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('❌ Erro ao verificar ranking existente:', checkError.message);
      return;
    }

    if (existingRanking) {
      console.log('⚠️ Ranking já existe no banco nomeia-ai');
      return;
    }

    // 2. Criar ranking de teste
    console.log('\n🔄 2. Criando ranking de teste...');
    const testRanking = {
      id: RANKING_ID,
      titulo: 'Ranking de Teste - Simulado ENEM 2024',
      orgao: 'INEP',
      banca: 'CESPE',
      status: 'Ativo',
      exam_type: 'Objetiva',
      has_minimum_score: false,
      total_minimum_score: 0,
      wrong_answer_penalty: 0,
      total_participants: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      descricao: 'Ranking criado para teste do frontend'
    };

    const { data: newRanking, error: createError } = await nomeiaAdmin
      .from('rankings')
      .insert(testRanking)
      .select('id, titulo')
      .single();

    if (createError) {
      console.log('❌ Erro ao criar ranking:', createError.message);
      return;
    }

    console.log('✅ Ranking criado:', newRanking.titulo);

    // 3. Criar algumas disciplinas de teste
    console.log('\n📚 3. Criando disciplinas de teste...');
    const testDisciplines = [
      {
        id: `${RANKING_ID}-matematica-${Date.now()}`,
        ranking_id: RANKING_ID,
        discipline_id: 'matematica',
        discipline_name: 'Matemática',
        minimum_score: 0,
        weight: 1,
        total_questions: 45
      },
      {
        id: `${RANKING_ID}-portugues-${Date.now() + 1}`,
        ranking_id: RANKING_ID,
        discipline_id: 'portugues',
        discipline_name: 'Português',
        minimum_score: 0,
        weight: 1,
        total_questions: 45
      }
    ];

    for (const discipline of testDisciplines) {
      const { error: disciplineError } = await nomeiaAdmin
        .from('ranking_disciplines')
        .insert(discipline);

      if (disciplineError) {
        console.log(`⚠️ Erro ao criar disciplina ${discipline.discipline_name}: ${disciplineError.message}`);
      } else {
        console.log(`✅ Disciplina criada: ${discipline.discipline_name}`);
      }
    }

    // 4. Criar algumas participações de teste
    console.log('\n👥 4. Criando participações de teste...');
    const testParticipations = [
      {
        id: `${RANKING_ID}-user1-${Date.now()}`,
        user_id: '50d2ba4b-67e5-486c-9a0f-eea78c5b0f1d',
        ranking_id: RANKING_ID,
        score: 850,
        position: 1,
        reservation_type: 'Ampla Concorrência',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `${RANKING_ID}-user2-${Date.now() + 1}`,
        user_id: '77c76c11-ffe6-4794-98d3-9c9ca5c61160',
        ranking_id: RANKING_ID,
        score: 820,
        position: 2,
        reservation_type: 'Ampla Concorrência',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `${RANKING_ID}-user3-${Date.now() + 2}`,
        user_id: '351fd688-a68f-474c-a187-f7913efdc154',
        ranking_id: RANKING_ID,
        score: 780,
        position: 3,
        reservation_type: 'Ampla Concorrência',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    for (const participation of testParticipations) {
      const { error: participationError } = await nomeiaAdmin
        .from('user_rankings')
        .insert(participation);

      if (participationError) {
        console.log(`⚠️ Erro ao criar participação: ${participationError.message}`);
      } else {
        console.log(`✅ Participação criada: User ${participation.user_id} - ${participation.score} pontos`);
      }
    }

    // 5. Atualizar contador de participantes
    console.log('\n📊 5. Atualizando contador de participantes...');
    const { error: updateError } = await nomeiaAdmin
      .from('rankings')
      .update({ total_participants: testParticipations.length })
      .eq('id', RANKING_ID);

    if (updateError) {
      console.log('⚠️ Erro ao atualizar contador:', updateError.message);
    } else {
      console.log('✅ Contador atualizado');
    }

    // 6. Verificar resultado final
    console.log('\n📊 6. Verificando resultado final...');
    const { data: finalRanking, error: finalError } = await nomeiaAdmin
      .from('rankings')
      .select(`
        id,
        titulo,
        status,
        total_participants,
        ranking_disciplines(count),
        user_rankings(count)
      `)
      .eq('id', RANKING_ID)
      .single();

    if (finalError) {
      console.log('❌ Erro ao verificar ranking final:', finalError.message);
    } else {
      console.log('✅ Ranking final verificado:');
      console.log(`  - Título: ${finalRanking.titulo}`);
      console.log(`  - Status: ${finalRanking.status}`);
      console.log(`  - Participantes: ${finalRanking.total_participants}`);
      console.log(`  - Disciplinas: ${finalRanking.ranking_disciplines?.[0]?.count || 0}`);
      console.log(`  - Participações: ${finalRanking.user_rankings?.[0]?.count || 0}`);
    }

    console.log('\n🎉 Ranking criado com sucesso! Agora o frontend deve funcionar.');

  } catch (error) {
    console.log('❌ Erro geral:', error);
  }
}

createMissingRanking().catch(console.error);



