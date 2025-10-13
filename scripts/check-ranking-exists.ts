import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const nomeiaUrl = process.env.VITE_SUPABASE_URL || 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

const supabaseAdmin = createClient(nomeiaUrl, nomeiaServiceRoleKey);

const RANKING_ID = 'f2522ebf-efb5-4e4f-a543-75364c830c88';

async function checkRankingExists() {
  console.log(`🔍 Verificando se ranking ${RANKING_ID} existe...`);

  try {
    // Verificar na tabela rankings
    const { data: ranking, error: rankingError } = await supabaseAdmin
      .from('rankings')
      .select('id, titulo, status')
      .eq('id', RANKING_ID)
      .single();

    if (rankingError) {
      console.log('❌ Ranking não encontrado:', rankingError.message);
    } else {
      console.log('✅ Ranking encontrado:', ranking);
    }

    // Verificar na tabela concursos
    const { data: concurso, error: concursoError } = await supabaseAdmin
      .from('concursos')
      .select('id, titulo, status')
      .eq('id', RANKING_ID)
      .single();

    if (concursoError) {
      console.log('❌ Concurso não encontrado:', concursoError.message);
    } else {
      console.log('✅ Concurso encontrado:', concurso);
    }

    // Listar todos os IDs disponíveis
    console.log('\n📋 Todos os rankings disponíveis:');
    const { data: allRankings, error: allError } = await supabaseAdmin
      .from('rankings')
      .select('id, titulo')
      .limit(10);

    if (allError) {
      console.log('❌ Erro ao listar rankings:', allError.message);
    } else {
      allRankings?.forEach(r => console.log(`  - ${r.id}: ${r.titulo}`));
    }

    console.log('\n📋 Todos os concursos disponíveis:');
    const { data: allConcursos, error: allConcursosError } = await supabaseAdmin
      .from('concursos')
      .select('id, titulo')
      .limit(10);

    if (allConcursosError) {
      console.log('❌ Erro ao listar concursos:', allConcursosError.message);
    } else {
      allConcursos?.forEach(c => console.log(`  - ${c.id}: ${c.titulo}`));
    }

  } catch (error) {
    console.log('❌ Erro:', error);
  }
}

if (import.meta.main) {
  checkRankingExists().catch(console.error);
}



