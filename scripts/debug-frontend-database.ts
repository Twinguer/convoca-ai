import { createClient } from '@supabase/supabase-js';

// Testar ambos os bancos
const originalUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const originalAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NzQ4MDAsImV4cCI6MjA1MjE1MDgwMH0.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const originalSupabase = createClient(originalUrl, originalAnonKey);
const nomeiaSupabase = createClient(nomeiaUrl, nomeiaAnonKey);

const RANKING_FRONTEND = 'f2522ebf-efb5-4e4f-a543-75364c830c88';
const RANKING_NOMEIA = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

async function debugFrontendDatabase() {
  console.log('🔍 Investigando qual banco o frontend está usando...');

  try {
    // 1. Verificar ranking do frontend no banco original
    console.log('\n📊 1. Verificando ranking do frontend no banco original...');
    const { data: originalRanking, error: originalError } = await originalSupabase
      .from('concursos')
      .select('id, titulo, status')
      .eq('id', RANKING_FRONTEND)
      .single();

    if (originalError) {
      console.log('❌ Ranking do frontend não encontrado no banco original:', originalError.message);
    } else {
      console.log('✅ Ranking do frontend encontrado no banco original:', originalRanking);
    }

    // 2. Verificar ranking do frontend no banco nomeia-ai
    console.log('\n📊 2. Verificando ranking do frontend no banco nomeia-ai...');
    const { data: nomeiaRanking, error: nomeiaError } = await nomeiaSupabase
      .from('rankings')
      .select('id, titulo, status')
      .eq('id', RANKING_FRONTEND)
      .single();

    if (nomeiaError) {
      console.log('❌ Ranking do frontend não encontrado no banco nomeia-ai:', nomeiaError.message);
    } else {
      console.log('✅ Ranking do frontend encontrado no banco nomeia-ai:', nomeiaRanking);
    }

    // 3. Verificar ranking do nomeia-ai no banco original
    console.log('\n📊 3. Verificando ranking do nomeia-ai no banco original...');
    const { data: originalNomeiaRanking, error: originalNomeiaError } = await originalSupabase
      .from('concursos')
      .select('id, titulo, status')
      .eq('id', RANKING_NOMEIA)
      .single();

    if (originalNomeiaError) {
      console.log('❌ Ranking do nomeia-ai não encontrado no banco original:', originalNomeiaError.message);
    } else {
      console.log('✅ Ranking do nomeia-ai encontrado no banco original:', originalNomeiaRanking);
    }

    // 4. Verificar ranking do nomeia-ai no banco nomeia-ai
    console.log('\n📊 4. Verificando ranking do nomeia-ai no banco nomeia-ai...');
    const { data: nomeiaNomeiaRanking, error: nomeiaNomeiaError } = await nomeiaSupabase
      .from('rankings')
      .select('id, titulo, status')
      .eq('id', RANKING_NOMEIA)
      .single();

    if (nomeiaNomeiaError) {
      console.log('❌ Ranking do nomeia-ai não encontrado no banco nomeia-ai:', nomeiaNomeiaError.message);
    } else {
      console.log('✅ Ranking do nomeia-ai encontrado no banco nomeia-ai:', nomeiaNomeiaRanking);
    }

    // 5. Listar todos os rankings de cada banco
    console.log('\n📋 5. Listando todos os rankings do banco original...');
    const { data: allOriginalRankings, error: allOriginalError } = await originalSupabase
      .from('concursos')
      .select('id, titulo, status')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allOriginalError) {
      console.log('❌ Erro ao listar rankings do banco original:', allOriginalError.message);
    } else {
      console.log(`✅ Rankings do banco original (${allOriginalRankings?.length || 0}):`);
      allOriginalRankings?.forEach(r => {
        console.log(`  - ${r.id}: ${r.titulo} (${r.status})`);
      });
    }

    console.log('\n📋 6. Listando todos os rankings do banco nomeia-ai...');
    const { data: allNomeiaRankings, error: allNomeiaError } = await nomeiaSupabase
      .from('rankings')
      .select('id, titulo, status')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allNomeiaError) {
      console.log('❌ Erro ao listar rankings do banco nomeia-ai:', allNomeiaError.message);
    } else {
      console.log(`✅ Rankings do banco nomeia-ai (${allNomeiaRankings?.length || 0}):`);
      allNomeiaRankings?.forEach(r => {
        console.log(`  - ${r.id}: ${r.titulo} (${r.status})`);
      });
    }

    // 6. Conclusão
    console.log('\n🎯 CONCLUSÃO:');
    if (originalRanking && !nomeiaRanking) {
      console.log('✅ Frontend está usando BANCO ORIGINAL (produção)');
      console.log('❌ Frontend NÃO está usando banco nomeia-ai');
    } else if (!originalRanking && nomeiaRanking) {
      console.log('❌ Frontend NÃO está usando banco original');
      console.log('✅ Frontend está usando BANCO NOMEIA-AI');
    } else if (originalRanking && nomeiaRanking) {
      console.log('⚠️ Ranking existe em ambos os bancos');
    } else {
      console.log('❌ Ranking não existe em nenhum banco');
    }

  } catch (error) {
    console.log('❌ Erro geral:', error);
  }
}

debugFrontendDatabase().catch(console.error);

