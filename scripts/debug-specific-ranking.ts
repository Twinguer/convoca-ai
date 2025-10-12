import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const nomeiaUrl = process.env.VITE_SUPABASE_URL || 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';
const nomeiaServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);
const supabaseAdmin = createClient(nomeiaUrl, nomeiaServiceRoleKey);

const RANKING_ID = 'f2522ebf-efb5-4e4f-a543-75364c830c88';

async function debugSpecificRanking() {
  console.log(`🔍 Investigando ranking específico: ${RANKING_ID}`);

  try {
    // 1. Verificar se existe na tabela rankings
    console.log('\n📊 1. Verificando na tabela rankings...');
    const { data: rankingData, error: rankingError } = await supabaseAdmin
      .from('rankings')
      .select('*')
      .eq('id', RANKING_ID)
      .single();

    if (rankingError) {
      console.log('❌ Ranking não encontrado na tabela rankings:', rankingError.message);
    } else {
      console.log('✅ Ranking encontrado na tabela rankings:', rankingData);
    }

    // 2. Verificar se existe na tabela concursos
    console.log('\n📊 2. Verificando na tabela concursos...');
    const { data: concursoData, error: concursoError } = await supabaseAdmin
      .from('concursos')
      .select('*')
      .eq('id', RANKING_ID)
      .single();

    if (concursoError) {
      console.log('❌ Concurso não encontrado na tabela concursos:', concursoError.message);
    } else {
      console.log('✅ Concurso encontrado na tabela concursos:', concursoData);
    }

    // 3. Verificar todos os rankings existentes
    console.log('\n📊 3. Listando todos os rankings existentes...');
    const { data: allRankings, error: allRankingsError } = await supabaseAdmin
      .from('rankings')
      .select('id, titulo, status, created_at')
      .order('created_at', { ascending: false });

    if (allRankingsError) {
      console.log('❌ Erro ao listar rankings:', allRankingsError.message);
    } else {
      console.log(`✅ Total de rankings: ${allRankings?.length || 0}`);
      allRankings?.forEach(r => {
        console.log(`  - ${r.titulo} (${r.id}) - ${r.status}`);
      });
    }

    // 4. Verificar todos os concursos existentes
    console.log('\n📊 4. Listando todos os concursos existentes...');
    const { data: allConcursos, error: allConcursosError } = await supabaseAdmin
      .from('concursos')
      .select('id, titulo, status, created_at')
      .order('created_at', { ascending: false });

    if (allConcursosError) {
      console.log('❌ Erro ao listar concursos:', allConcursosError.message);
    } else {
      console.log(`✅ Total de concursos: ${allConcursos?.length || 0}`);
      allConcursos?.forEach(c => {
        console.log(`  - ${c.titulo} (${c.id}) - ${c.status}`);
      });
    }

    // 5. Verificar se o ranking ID está sendo usado em participações
    console.log('\n📊 5. Verificando participações com este ID...');
    const { data: participations, error: participationsError } = await supabaseAdmin
      .from('user_rankings')
      .select('id, user_id, ranking_id, concurso_id, score')
      .or(`ranking_id.eq.${RANKING_ID},concurso_id.eq.${RANKING_ID}`);

    if (participationsError) {
      console.log('❌ Erro ao buscar participações:', participationsError.message);
    } else {
      console.log(`✅ Participações encontradas: ${participations?.length || 0}`);
      participations?.forEach(p => {
        console.log(`  - User: ${p.user_id}, Ranking: ${p.ranking_id}, Concurso: ${p.concurso_id}, Score: ${p.score}`);
      });
    }

    // 6. Tentar criar o ranking se não existir
    if (rankingError && concursoData) {
      console.log('\n🔄 6. Tentando criar ranking a partir do concurso...');
      
      const rankingData = {
        id: concursoData.id,
        titulo: concursoData.titulo,
        orgao: concursoData.orgao || 'Não informado',
        banca: concursoData.banca || 'Não informado',
        status: concursoData.status || 'Ativo',
        exam_type: concursoData.exam_type || 'Objetiva',
        has_minimum_score: concursoData.has_minimum_score || false,
        total_minimum_score: concursoData.total_minimum_score || 0,
        wrong_answer_penalty: concursoData.wrong_answer_penalty || 0,
        total_participants: 0,
        created_at: concursoData.created_at,
        updated_at: concursoData.updated_at,
        created_by: concursoData.created_by_user_id,
        descricao: concursoData.link
      };

      const { data: newRanking, error: createError } = await supabaseAdmin
        .from('rankings')
        .insert(rankingData)
        .select('id, titulo')
        .single();

      if (createError) {
        console.log('❌ Erro ao criar ranking:', createError.message);
      } else {
        console.log('✅ Ranking criado com sucesso:', newRanking);
      }
    }

    // 7. Verificar se a função ensure_ranking_exists funciona
    console.log('\n🧪 7. Testando função ensure_ranking_exists...');
    try {
      const { data: ensureResult, error: ensureError } = await supabaseAdmin
        .rpc('ensure_ranking_exists', { concurso_id_param: RANKING_ID });
      
      if (ensureError) {
        console.log('❌ Erro na função ensure_ranking_exists:', ensureError.message);
      } else {
        console.log('✅ Função ensure_ranking_exists executada:', ensureResult);
      }
    } catch (err) {
      console.log('❌ Erro ao executar ensure_ranking_exists:', err);
    }

  } catch (error) {
    console.log('❌ Erro geral na investigação:', error);
  }
}

if (import.meta.main) {
  debugSpecificRanking().catch(console.error);
}

