import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Banco original (produção)
const originalUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const originalAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NzQ4MDAsImV4cCI6MjA1MjE1MDgwMH0.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

// Banco nomeia-ai (desenvolvimento)
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';
const nomeiaServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEzMjI2MywiZXhwIjoyMDc1NzA4MjYzfQ.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const originalSupabase = createClient(originalUrl, originalAnonKey);
const nomeiaSupabase = createClient(nomeiaUrl, nomeiaAnonKey);
const nomeiaAdmin = createClient(nomeiaUrl, nomeiaServiceRoleKey);

const RANKING_ID = 'f2522ebf-efb5-4e4f-a543-75364c830c88';

async function migrateSpecificRanking() {
  console.log(`🔄 Migrando ranking específico: ${RANKING_ID}`);

  try {
    // 1. Buscar concurso no banco original
    console.log('\n📊 1. Buscando concurso no banco original...');
    const { data: concurso, error: concursoError } = await originalSupabase
      .from('concursos')
      .select('*')
      .eq('id', RANKING_ID)
      .single();

    if (concursoError) {
      console.log('❌ Concurso não encontrado no banco original:', concursoError.message);
      return;
    }

    console.log('✅ Concurso encontrado:', concurso.titulo);

    // 2. Verificar se já existe no banco nomeia-ai
    console.log('\n📊 2. Verificando se já existe no banco nomeia-ai...');
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

    // 3. Criar ranking no banco nomeia-ai
    console.log('\n🔄 3. Criando ranking no banco nomeia-ai...');
    const rankingData = {
      id: concurso.id,
      titulo: concurso.titulo,
      orgao: concurso.orgao || 'Não informado',
      banca: concurso.banca || 'Não informado',
      status: concurso.status || 'Ativo',
      exam_type: concurso.exam_type || 'Objetiva',
      has_minimum_score: concurso.has_minimum_score || false,
      total_minimum_score: concurso.total_minimum_score || 0,
      wrong_answer_penalty: concurso.wrong_answer_penalty || 0,
      total_participants: 0,
      created_at: concurso.created_at,
      updated_at: concurso.updated_at,
      created_by: concurso.created_by_user_id,
      descricao: concurso.link
    };

    const { data: newRanking, error: createError } = await nomeiaAdmin
      .from('rankings')
      .insert(rankingData)
      .select('id, titulo')
      .single();

    if (createError) {
      console.log('❌ Erro ao criar ranking:', createError.message);
      return;
    }

    console.log('✅ Ranking criado:', newRanking.titulo);

    // 4. Migrar disciplinas se existirem
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      console.log('\n📚 4. Migrando disciplinas...');
      
      for (const discipline of concurso.disciplines) {
        if (discipline.isEnabled && discipline.type) {
          const disciplineData = {
            id: `${concurso.id}-${discipline.type}-${Date.now()}`,
            ranking_id: concurso.id,
            discipline_id: discipline.type,
            discipline_name: discipline.name || discipline.type,
            minimum_score: discipline.minimum_score || 0,
            weight: discipline.weight || 1,
            total_questions: discipline.questionCount || 0
          };

          const { error: disciplineError } = await nomeiaAdmin
            .from('ranking_disciplines')
            .insert(disciplineData);

          if (disciplineError) {
            console.log(`⚠️ Erro ao migrar disciplina ${discipline.name}: ${disciplineError.message}`);
          } else {
            console.log(`✅ Disciplina migrada: ${discipline.name}`);
          }
        }
      }
    }

    // 5. Migrar participações se existirem
    console.log('\n👥 5. Verificando participações no banco original...');
    const { data: participations, error: participationsError } = await originalSupabase
      .from('user_rankings')
      .select('*')
      .eq('concurso_id', RANKING_ID);

    if (participationsError) {
      console.log('⚠️ Erro ao buscar participações:', participationsError.message);
    } else if (participations && participations.length > 0) {
      console.log(`📊 Encontradas ${participations.length} participações para migrar`);
      
      for (const participation of participations) {
        const participationData = {
          id: participation.id,
          user_id: participation.user_id,
          ranking_id: RANKING_ID,
          score: participation.score || 0,
          position: participation.position || 0,
          reservation_type: participation.reservation_type || 'Ampla Concorrência',
          created_at: participation.created_at,
          updated_at: participation.updated_at
        };

        const { error: participationError } = await nomeiaAdmin
          .from('user_rankings')
          .upsert(participationData, { onConflict: 'id' });

        if (participationError) {
          console.log(`⚠️ Erro ao migrar participação: ${participationError.message}`);
        } else {
          console.log(`✅ Participação migrada: ${participation.user_id}`);
        }
      }
    } else {
      console.log('ℹ️ Nenhuma participação encontrada para migrar');
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

    console.log('\n🎉 Migração do ranking específico concluída!');

  } catch (error) {
    console.log('❌ Erro geral na migração:', error);
  }
}

if (import.meta.main) {
  migrateSpecificRanking().catch(console.error);
}

