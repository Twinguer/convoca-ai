import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis do arquivo conv.env (convoca-ai)
config({ path: 'conv.env', override: true });

const convocaUrl = process.env.VITE_SUPABASE_URL || '';
const convocaKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Carregar variáveis do arquivo .env (nomeia-ai)
config({ path: '.env', override: true });

const nomeiaUrl = process.env.VITE_SUPABASE_URL || '';
const nomeiaKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!convocaUrl || !convocaKey || !nomeiaUrl || !nomeiaKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const convocaSupabase = createClient(convocaUrl, convocaKey);
const nomeiaSupabase = createClient(nomeiaUrl, nomeiaKey);

async function checkRankingInBothDatabases() {
  console.log('🔍 Verificando ranking em ambos os bancos de dados...\n');

  const rankingId = '22dea332-4990-43c9-82f4-da1e0311a6f8';

  try {
    // 1. Verificar no convoca-ai
    console.log('1. Verificando no convoca-ai...');
    const { data: convocaRanking, error: convocaError } = await convocaSupabase
      .from('concursos')
      .select('id, titulo, orgao, banca, status, exam_booklets')
      .eq('id', rankingId)
      .maybeSingle();
    
    if (convocaError) {
      console.error('❌ Erro no convoca-ai:', convocaError.message);
    } else if (convocaRanking) {
      console.log('✅ Encontrado no convoca-ai:');
      console.log('   - Título:', convocaRanking.titulo);
      console.log('   - Órgão:', convocaRanking.orgao);
      console.log('   - Banca:', convocaRanking.banca);
      console.log('   - Status:', convocaRanking.status);
      console.log('   - Cadernos:', convocaRanking.exam_booklets?.length || 0);
    } else {
      console.log('❌ Não encontrado no convoca-ai');
    }

    // 2. Verificar no nomeia-ai
    console.log('\n2. Verificando no nomeia-ai...');
    const { data: nomeiaRanking, error: nomeiaError } = await nomeiaSupabase
      .from('concursos')
      .select('id, titulo, orgao, banca, status, exam_booklets')
      .eq('id', rankingId)
      .maybeSingle();
    
    if (nomeiaError) {
      console.error('❌ Erro no nomeia-ai:', nomeiaError.message);
    } else if (nomeiaRanking) {
      console.log('✅ Encontrado no nomeia-ai:');
      console.log('   - Título:', nomeiaRanking.titulo);
      console.log('   - Órgão:', nomeiaRanking.orgao);
      console.log('   - Banca:', nomeiaRanking.banca);
      console.log('   - Status:', nomeiaRanking.status);
      console.log('   - Cadernos:', nomeiaRanking.exam_booklets?.length || 0);
    } else {
      console.log('❌ Não encontrado no nomeia-ai');
    }

    // 3. Verificar se existe em rankings (nomeia-ai)
    console.log('\n3. Verificando na tabela rankings (nomeia-ai)...');
    const { data: nomeiaRankings, error: nomeiaRankingsError } = await nomeiaSupabase
      .from('rankings')
      .select('id, titulo, orgao, banca, status, exam_booklets')
      .eq('id', rankingId)
      .maybeSingle();
    
    if (nomeiaRankingsError) {
      console.error('❌ Erro na tabela rankings:', nomeiaRankingsError.message);
    } else if (nomeiaRankings) {
      console.log('✅ Encontrado na tabela rankings:');
      console.log('   - Título:', nomeiaRankings.titulo);
      console.log('   - Órgão:', nomeiaRankings.orgao);
      console.log('   - Banca:', nomeiaRankings.banca);
      console.log('   - Status:', nomeiaRankings.status);
      console.log('   - Cadernos:', nomeiaRankings.exam_booklets?.length || 0);
    } else {
      console.log('❌ Não encontrado na tabela rankings');
    }

    // 4. Listar alguns rankings existentes para referência
    console.log('\n4. Listando alguns rankings existentes...');
    
    // Convoca-ai
    const { data: convocaList } = await convocaSupabase
      .from('concursos')
      .select('id, titulo, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('   Convoca-ai (últimos 5):');
    convocaList?.forEach((r, i) => {
      console.log(`     ${i + 1}. ${r.titulo} (${r.id})`);
    });

    // Nomeia-ai concursos
    const { data: nomeiaList } = await nomeiaSupabase
      .from('concursos')
      .select('id, titulo, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('   Nomeia-ai concursos (últimos 5):');
    nomeiaList?.forEach((r, i) => {
      console.log(`     ${i + 1}. ${r.titulo} (${r.id})`);
    });

    // Nomeia-ai rankings
    const { data: nomeiaRankingsList } = await nomeiaSupabase
      .from('rankings')
      .select('id, titulo, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('   Nomeia-ai rankings (últimos 5):');
    nomeiaRankingsList?.forEach((r, i) => {
      console.log(`     ${i + 1}. ${r.titulo} (${r.id})`);
    });

    console.log('\n🎯 CONCLUSÃO:');
    console.log('=' .repeat(50));
    
    if (convocaRanking) {
      console.log('✅ Ranking existe no convoca-ai - use convoca-ai para análise');
    } else if (nomeiaRanking) {
      console.log('✅ Ranking existe no nomeia-ai (concursos) - use nomeia-ai para análise');
    } else if (nomeiaRankings) {
      console.log('✅ Ranking existe no nomeia-ai (rankings) - use nomeia-ai para análise');
    } else {
      console.log('❌ Ranking não encontrado em nenhum banco!');
      console.log('   - Verifique se o ID está correto');
      console.log('   - Verifique se o ranking foi criado');
    }

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

checkRankingInBothDatabases();



