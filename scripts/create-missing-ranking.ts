import { createClient } from '@supabase/supabase-js';

const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEzMjI2MywiZXhwIjoyMDc1NzA4MjYzfQ.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const supabaseAdmin = createClient(nomeiaUrl, nomeiaServiceRoleKey);
const RANKING_ID = 'f2522ebf-efb5-4e4f-a543-75364c830c88';

async function createMissingRanking() {
  console.log(`🔄 Criando ranking faltante: ${RANKING_ID}`);

  try {
    // Criar ranking de teste
    const rankingData = {
      id: RANKING_ID,
      titulo: 'Simulado ENEM 2024 - Classificação Pós-prova',
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
      descricao: 'Simulado ENEM 2024 para classificação pós-prova'
    };

    const { data: newRanking, error: createError } = await supabaseAdmin
      .from('rankings')
      .insert(rankingData)
      .select('id, titulo')
      .single();

    if (createError) {
      console.log('❌ Erro ao criar ranking:', createError.message);
      return;
    }

    console.log('✅ Ranking criado:', newRanking.titulo);

    // Criar algumas disciplinas
    const disciplines = [
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
      },
      {
        id: `${RANKING_ID}-ciencias-${Date.now() + 2}`,
        ranking_id: RANKING_ID,
        discipline_id: 'ciencias',
        discipline_name: 'Ciências da Natureza',
        minimum_score: 0,
        weight: 1,
        total_questions: 45
      }
    ];

    console.log('\n📚 Criando disciplinas...');
    for (const discipline of disciplines) {
      const { error: disciplineError } = await supabaseAdmin
        .from('ranking_disciplines')
        .insert(discipline);

      if (disciplineError) {
        console.log(`⚠️ Erro ao criar disciplina ${discipline.discipline_name}: ${disciplineError.message}`);
      } else {
        console.log(`✅ Disciplina criada: ${discipline.discipline_name}`);
      }
    }

    // Criar algumas participações de teste
    console.log('\n👥 Criando participações de teste...');
    const testUsers = [
      { user_id: '50d2ba4b-67e5-486c-9a0f-eea78c5b0f1d', score: 850, position: 1 },
      { user_id: '77c76c11-ffe6-4794-98d3-9c9ca5c61160', score: 820, position: 2 },
      { user_id: '351fd688-a68f-474c-a187-f7913efdc154', score: 780, position: 3 },
      { user_id: 'c585add3-59ac-42bd-b9db-479b529bc594', score: 750, position: 4 },
      { user_id: '12a8dbca-a222-4711-bbd0-067763c1c84e', score: 720, position: 5 }
    ];

    for (const user of testUsers) {
      const participationData = {
        id: `${RANKING_ID}-${user.user_id}-${Date.now()}`,
        user_id: user.user_id,
        ranking_id: RANKING_ID,
        score: user.score,
        position: user.position,
        reservation_type: 'Ampla Concorrência',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: participationError } = await supabaseAdmin
        .from('user_rankings')
        .insert(participationData);

      if (participationError) {
        console.log(`⚠️ Erro ao criar participação para ${user.user_id}: ${participationError.message}`);
      } else {
        console.log(`✅ Participação criada: ${user.user_id} - ${user.score} pontos`);
      }
    }

    // Verificar resultado final
    console.log('\n📊 Verificando resultado final...');
    const { data: finalRanking, error: finalError } = await supabaseAdmin
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

    console.log('\n🎉 Ranking criado com sucesso!');

  } catch (error) {
    console.log('❌ Erro geral:', error);
  }
}

createMissingRanking().catch(console.error);



