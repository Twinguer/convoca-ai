import { createClient } from '@supabase/supabase-js';

const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);
const RANKING_ID = 'f2522ebf-efb5-4e4f-a543-75364c830c88';

async function checkRankingInNomeia() {
  console.log(`🔍 Verificando ranking ${RANKING_ID} no banco nomeia-ai...`);

  try {
    // Verificar se ranking existe
    const { data: ranking, error: rankingError } = await supabase
      .from('rankings')
      .select('id, titulo, status')
      .eq('id', RANKING_ID)
      .single();

    if (rankingError) {
      console.log('❌ Ranking não encontrado:', rankingError.message);
      
      // Listar rankings disponíveis
      console.log('\n📋 Rankings disponíveis no banco nomeia-ai:');
      const { data: allRankings, error: allError } = await supabase
        .from('rankings')
        .select('id, titulo, status')
        .limit(10);

      if (allError) {
        console.log('❌ Erro ao listar rankings:', allError.message);
      } else {
        allRankings?.forEach(r => {
          console.log(`  - ${r.id}: ${r.titulo} (${r.status})`);
        });
      }
    } else {
      console.log('✅ Ranking encontrado:', ranking);
    }

  } catch (error) {
    console.log('❌ Erro:', error);
  }
}

checkRankingInNomeia().catch(console.error);



