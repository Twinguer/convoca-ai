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

async function testConcursosBasic() {
  console.log('🧪 TESTANDO INSERÇÃO BÁSICA NA TABELA CONCURSOS');
  console.log('=' .repeat(60));

  try {
    // Dados de teste apenas com campos básicos (sem JSONB)
    const testData = {
      titulo: 'TESTE RANKING BÁSICO',
      orgao: 'TESTE ORGÃO BÁSICO',
      banca: 'TESTE BANCA BÁSICO',
      status: 'Em andamento',
      exam_type: 'Alternativas',
      has_minimum_score: false,
      total_minimum_score: 0,
      wrong_answer_penalty: 0,
      alternatives_count: 5,
      has_custom_knowledge: true,
      created_by_user_id: '34d22725-d158-4d75-9089-efd049a1fb98'
    };

    console.log('📝 Dados de teste (apenas campos básicos):', JSON.stringify(testData, null, 2));

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
      console.log('✅ Inserção básica bem-sucedida!');
      console.log('📊 Dados inseridos:', data);
      
      const concursoId = data[0].id;
      
      // Agora tentar atualizar com campos JSONB
      console.log('\n🔄 Tentando atualizar com campos JSONB...');
      
      const { error: updateError } = await supabase
        .from('concursos')
        .update({
          disciplines: [
            {
              id: 'test-discipline-basic-1',
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
        })
        .eq('id', concursoId);

      if (updateError) {
        console.error('❌ Erro na atualização com JSONB:', updateError);
      } else {
        console.log('✅ Atualização com JSONB bem-sucedida!');
        
        // Verificar resultado final
        const { data: finalData, error: finalError } = await supabase
          .from('concursos')
          .select('*')
          .eq('id', concursoId)
          .single();
          
        if (finalError) {
          console.error('❌ Erro ao buscar resultado final:', finalError);
        } else {
          console.log('🎉 Resultado final:', finalData);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testConcursosBasic();



