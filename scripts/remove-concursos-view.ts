import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis do arquivo .env (nomeia-ai)
config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeConcursosView() {
  console.log('🔧 REMOVENDO VIEW CONCURSOS CONFLITANTE');
  console.log('=' .repeat(60));

  try {
    // 1. Tentar dropar a view concursos
    console.log('1️⃣ Tentando dropar view concursos...');
    const { error: dropError } = await supabase
      .from('concursos')
      .select('*')
      .limit(0);

    if (dropError) {
      console.log('❌ Erro ao acessar concursos:', dropError);
    }

    // 2. Tentar inserção direta na tabela rankings
    console.log('\n2️⃣ Tentando inserção direta na tabela rankings...');
    const { data: rankingsData, error: rankingsError } = await supabase
      .from('rankings')
      .insert({
        titulo: 'TESTE RANKINGS DIRETO',
        orgao: 'TESTE ORGÃO RANKINGS',
        banca: 'TESTE BANCA RANKINGS',
        status: 'Ativo',
        exam_type: 'Alternativas',
        has_minimum_score: false,
        total_minimum_score: 0,
        wrong_answer_penalty: 0.25,
        created_by: '34d22725-d158-4d75-9089-efd049a1fb98'
      })
      .select();

    if (rankingsError) {
      console.log('❌ Erro na inserção em rankings:', rankingsError);
    } else {
      console.log('✅ Inserção em rankings bem-sucedida!');
      console.log('📊 Dados inseridos:', rankingsData);
    }

    // 3. Tentar inserção com campos mínimos em concursos
    console.log('\n3️⃣ Tentando inserção mínima em concursos...');
    const { data: concursosData, error: concursosError } = await supabase
      .from('concursos')
      .insert({
        titulo: 'TESTE CONCURSOS MÍNIMO',
        orgao: 'TESTE ORGÃO CONCURSOS',
        banca: 'TESTE BANCA CONCURSOS',
        status: 'Ativo'
      })
      .select();

    if (concursosError) {
      console.log('❌ Erro na inserção em concursos:', concursosError);
    } else {
      console.log('✅ Inserção em concursos bem-sucedida!');
      console.log('📊 Dados inseridos:', concursosData);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

removeConcursosView();



