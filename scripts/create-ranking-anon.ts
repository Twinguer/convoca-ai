import { createClient } from '@supabase/supabase-js';

const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);
const RANKING_ID = 'f2522ebf-efb5-4e4f-a543-75364c830c88';

async function createRankingAnon() {
  console.log(`🔄 Tentando criar ranking com chave anônima: ${RANKING_ID}`);

  try {
    // 1. Verificar se já existe
    console.log('\n📊 1. Verificando se ranking já existe...');
    const { data: existingRanking, error: checkError } = await supabase
      .from('rankings')
      .select('id')
      .eq('id', RANKING_ID)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('❌ Erro ao verificar ranking existente:', checkError.message);
      return;
    }

    if (existingRanking) {
      console.log('✅ Ranking já existe no banco nomeia-ai');
      return;
    }

    // 2. Tentar criar ranking
    console.log('\n🔄 2. Tentando criar ranking...');
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

    const { data: newRanking, error: createError } = await supabase
      .from('rankings')
      .insert(testRanking)
      .select('id, titulo')
      .single();

    if (createError) {
      console.log('❌ Erro ao criar ranking:', createError.message);
      console.log('💡 Isso é esperado - chave anônima não tem permissão para inserir');
      return;
    }

    console.log('✅ Ranking criado:', newRanking.titulo);

  } catch (error) {
    console.log('❌ Erro geral:', error);
  }
}

createRankingAnon().catch(console.error);

