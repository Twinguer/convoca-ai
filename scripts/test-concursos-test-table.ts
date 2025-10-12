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

async function testConcursosTestTable() {
  console.log('🧪 TESTANDO INSERÇÃO NA TABELA CONCURSOS_TEST');
  console.log('=' .repeat(60));

  try {
    // Dados de teste
    const testData = {
      titulo: 'TESTE RANKING TEST TABLE',
      orgao: 'TESTE ORGÃO TEST TABLE',
      banca: 'TESTE BANCA TEST TABLE',
      status: 'Em andamento',
      exam_type: 'Alternativas',
      has_minimum_score: false,
      total_minimum_score: 0,
      wrong_answer_penalty: 0,
      alternatives_count: 5,
      has_custom_knowledge: true,
      created_by_user_id: '34d22725-d158-4d75-9089-efd049a1fb98',
      disciplines: [
        {
          id: 'test-discipline-test-1',
          name: 'Matemática',
          type: 'basic_knowledge',
          isEnabled: true,
          questionCount: 10,
          weight: 1.0,
          minimum_score: 0
        }
      ],
      subjects: [],
      form_config: {},
      official_answers: {},
      exam_booklets: [],
      metadata: {},
      total_participants: 0
    };

    console.log('📝 Dados de teste:', JSON.stringify(testData, null, 2));

    // Tentar inserir
    const { data, error } = await supabase
      .from('concursos_test')
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

testConcursosTestTable();

