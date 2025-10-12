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

async function testConcursosSimple() {
  console.log('🧪 TESTANDO INSERÇÃO SIMPLES NA TABELA CONCURSOS');
  console.log('=' .repeat(60));

  try {
    // Dados de teste simples (apenas campos essenciais)
    const testData = {
      titulo: 'TESTE RANKING SIMPLES',
      orgao: 'TESTE ORGÃO SIMPLES',
      banca: 'TESTE BANCA SIMPLES',
      status: 'Em andamento',
      exam_type: 'Alternativas',
      has_minimum_score: false,
      total_minimum_score: 0,
      wrong_answer_penalty: 0,
      alternatives_count: 5,
      created_by_user_id: '34d22725-d158-4d75-9089-efd049a1fb98'
    };

    console.log('📝 Dados de teste:', JSON.stringify(testData, null, 2));

    // Tentar inserir
    const { data, error } = await supabase
      .from('concursos')
      .insert(testData)
      .select();

    if (error) {
      console.error('❌ Erro na inserção:', error);
      console.error('Detalhes do erro:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('✅ Inserção bem-sucedida!');
      console.log('📊 Dados inseridos:', data);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testConcursosSimple();

