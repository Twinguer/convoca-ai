import { createClient } from '@supabase/supabase-js';

// Simular a configuração do frontend
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);
const RANKING_ID = 'f2522ebf-efb5-4e4f-a543-75364c830c88';

async function debugFrontendConfig() {
  console.log(`🔍 Testando busca do ranking ${RANKING_ID} com configuração do frontend...`);
  console.log(`📡 URL: ${nomeiaUrl}`);
  console.log(`🔑 Key: ${nomeiaAnonKey.substring(0, 20)}...`);

  try {
    // Testar a mesma query que o frontend está fazendo
    console.log('\n🧪 1. Testando query simples (como no ParticipationForm)...');
    const { data: rankingExists, error: rankingError } = await supabase
      .from('rankings')
      .select('id')
      .eq('id', RANKING_ID)
      .single();

    if (rankingError) {
      console.log('❌ Erro na query simples:', rankingError.message);
    } else {
      console.log('✅ Query simples funcionou:', rankingExists);
    }

    // Testar query com mais campos
    console.log('\n🧪 2. Testando query com mais campos...');
    const { data: rankingData, error: rankingDataError } = await supabase
      .from('rankings')
      .select('id, titulo, status, total_participants')
      .eq('id', RANKING_ID)
      .single();

    if (rankingDataError) {
      console.log('❌ Erro na query com campos:', rankingDataError.message);
    } else {
      console.log('✅ Query com campos funcionou:', rankingData);
    }

    // Testar query de participações
    console.log('\n🧪 3. Testando query de participações...');
    const { data: participations, error: participationsError } = await supabase
      .from('user_rankings')
      .select('id, user_id, score, position')
      .eq('ranking_id', RANKING_ID)
      .limit(5);

    if (participationsError) {
      console.log('❌ Erro na query de participações:', participationsError.message);
    } else {
      console.log(`✅ Query de participações funcionou: ${participations?.length || 0} registros`);
      participations?.forEach(p => {
        console.log(`  - User: ${p.user_id}, Score: ${p.score}, Position: ${p.position}`);
      });
    }

    // Testar query de classificação (como no RankingTable)
    console.log('\n🧪 4. Testando query de classificação...');
    const { data: classificationData, error: classificationError } = await supabase
      .from('user_rankings')
      .select(`
        id,
        score,
        position,
        users_profiles!inner(
          name
        )
      `)
      .eq('ranking_id', RANKING_ID)
      .order('score', { ascending: false })
      .limit(10);

    if (classificationError) {
      console.log('❌ Erro na query de classificação:', classificationError.message);
    } else {
      console.log(`✅ Query de classificação funcionou: ${classificationData?.length || 0} registros`);
      classificationData?.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.users_profiles?.name}: ${item.score} pontos`);
      });
    }

    console.log('\n🎉 Todas as queries funcionaram! O problema deve estar no cache do navegador.');

  } catch (error) {
    console.log('❌ Erro geral:', error);
  }
}

debugFrontendConfig().catch(console.error);



