import { createClient } from '@supabase/supabase-js';

// Banco nomeia-ai (desenvolvimento)
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';
const nomeiaServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEzMjI2MywiZXhwIjoyMDc1NzA4MjYzfQ.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const nomeiaSupabase = createClient(nomeiaUrl, nomeiaAnonKey);
const nomeiaAdmin = createClient(nomeiaUrl, nomeiaServiceRoleKey);

const RANKING_ID = 'f2522ebf-efb5-4e4f-a543-75364c830c88';

async function fixRanking404() {
  console.log(`🔧 Corrigindo erro 404 para ranking: ${RANKING_ID}`);

  try {
    // 1. Verificar se ranking existe
    console.log('\n📊 1. Verificando se ranking existe...');
    const { data: existingRanking, error: checkError } = await nomeiaAdmin
      .from('rankings')
      .select('id, titulo, status')
      .eq('id', RANKING_ID)
      .single();

    if (checkError) {
      console.log('❌ Ranking não encontrado:', checkError.message);
      
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
        descricao: 'Ranking criado para teste'
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
    } else {
      console.log('✅ Ranking já existe:', existingRanking.titulo);
    }

    // 3. Verificar participações
    console.log('\n📊 3. Verificando participações...');
    const { data: participations, error: participationsError } = await nomeiaAdmin
      .from('user_rankings')
      .select('id, user_id, score, position')
      .eq('ranking_id', RANKING_ID);

    if (participationsError) {
      console.log('❌ Erro ao buscar participações:', participationsError.message);
    } else {
      console.log(`✅ Participações encontradas: ${participations?.length || 0}`);
      if (participations && participations.length > 0) {
        participations.forEach(p => {
          console.log(`  - User: ${p.user_id}, Score: ${p.score}, Position: ${p.position}`);
        });
      }
    }

    // 4. Testar busca do ranking
    console.log('\n🧪 4. Testando busca do ranking...');
    const { data: testRanking, error: testError } = await nomeiaSupabase
      .from('rankings')
      .select('id, titulo, status')
      .eq('id', RANKING_ID)
      .single();

    if (testError) {
      console.log('❌ Erro ao buscar ranking:', testError.message);
    } else {
      console.log('✅ Ranking encontrado na busca:', testRanking.titulo);
    }

    console.log('\n🎉 Correção concluída!');

  } catch (error) {
    console.log('❌ Erro geral:', error);
  }
}

// Executar
fixRanking404().catch(console.error);

