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

async function testConcursosComplete() {
  console.log('🧪 TESTANDO INSERÇÃO COMPLETA NA TABELA CONCURSOS');
  console.log('=' .repeat(60));

  try {
    // Dados de teste completos (simulando o useSaveRanking.ts)
    const testData = {
      titulo: 'TESTE RANKING COMPLETO',
      orgao: 'TESTE ORGÃO COMPLETO',
      banca: 'TESTE BANCA COMPLETO',
      status: 'Ativo',  // Status válido
      exam_type: 'Alternativas',
      has_minimum_score: false,
      total_minimum_score: 0,
      wrong_answer_penalty: 0.25,
      alternatives_count: 5,
      has_custom_knowledge: true,
      created_by_user_id: '34d22725-d158-4d75-9089-efd049a1fb98'
    };

    console.log('📝 Dados de teste (campos básicos):', JSON.stringify(testData, null, 2));

    // Primeira etapa: inserir dados básicos
    const { data: insertResult, error: insertError } = await supabase
      .from('concursos')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Erro na inserção básica:', insertError);
      return;
    }

    console.log('✅ Inserção básica bem-sucedida!');
    console.log('📊 Dados inseridos:', insertResult);

    const concursoId = insertResult[0].id;

    // Segunda etapa: atualizar com campos JSONB
    console.log('\n🔄 Atualizando com campos JSONB...');
    
    const { error: updateError } = await supabase
      .from('concursos')
      .update({
        disciplines: [
          {
            id: 'test-discipline-complete-1',
            name: 'Matemática',
            type: 'basic_knowledge',
            isEnabled: true,
            questionCount: 10,
            weight: 1.0,
            minimum_score: 0
          },
          {
            id: 'test-discipline-complete-2',
            name: 'Português',
            type: 'specific_knowledge_1',
            isEnabled: true,
            questionCount: 15,
            weight: 1.5,
            minimum_score: 0
          }
        ],
        subjects: [],
        form_config: {
          has_quota_minimum_score: false,
          quota_minimum_score: 0
        },
        official_answers: {},
        exam_booklets: [
          {
            id: 'booklet-1',
            name: 'Caderno A',
            total_questions: 25
          }
        ],
        metadata: {
          created_by_admin: false,
          version: '1.0'
        },
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
        console.log('🎉 Resultado final:');
        console.log('📊 ID:', finalData.id);
        console.log('📊 Título:', finalData.titulo);
        console.log('📊 Status:', finalData.status);
        console.log('📊 Disciplinas:', finalData.disciplines);
        console.log('📊 Cadernos:', finalData.exam_booklets);
        console.log('📊 Config:', finalData.form_config);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testConcursosComplete();

