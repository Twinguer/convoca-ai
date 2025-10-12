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

async function testConcursosJsonbComplete() {
  console.log('🧪 TESTANDO INSERÇÃO COMPLETA COM CAMPOS JSONB');
  console.log('=' .repeat(60));

  try {
    // Dados de teste completos (simulando o useSaveRanking.ts real)
    const testData = {
      titulo: 'TESTE RANKING JSONB COMPLETO',
      orgao: 'TESTE ORGÃO JSONB',
      banca: 'TESTE BANCA JSONB',
      status: 'Ativo',
      exam_type: 'Alternativas',
      has_minimum_score: false,
      total_minimum_score: 0,
      wrong_answer_penalty: 0.25,
      alternatives_count: 5,
      has_custom_knowledge: true,
      created_by_user_id: '34d22725-d158-4d75-9089-efd049a1fb98',
      disciplines: [
        {
          id: 'test-discipline-jsonb-1',
          name: 'Matemática',
          type: 'basic_knowledge',
          isEnabled: true,
          questionCount: 10,
          weight: 1.0,
          minimum_score: 0
        },
        {
          id: 'test-discipline-jsonb-2',
          name: 'Português',
          type: 'specific_knowledge_1',
          isEnabled: true,
          questionCount: 15,
          weight: 1.5,
          minimum_score: 0
        }
      ],
      subjects: [
        { name: 'Matemática Básica' },
        { name: 'Português Avançado' }
      ],
      form_config: {
        has_quota_minimum_score: false,
        quota_minimum_score: 0,
        allow_multiple_attempts: true
      },
      official_answers: {
        '1': 'A',
        '2': 'B',
        '3': 'C',
        '4': 'D',
        '5': 'E'
      },
      exam_booklets: [
        {
          id: 'booklet-jsonb-1',
          name: 'Caderno A',
          total_questions: 25
        },
        {
          id: 'booklet-jsonb-2',
          name: 'Caderno B',
          total_questions: 30
        }
      ],
      metadata: {
        created_by_admin: false,
        version: '1.0',
        source: 'test_script',
        features: ['jsonb_test', 'complete_insertion']
      },
      total_participants: 0
    };

    console.log('📝 Dados de teste completos:', JSON.stringify(testData, null, 2));

    // Tentar inserção completa de uma vez
    console.log('\n1️⃣ Tentando inserção completa de uma vez...');
    const { data: insertResult, error: insertError } = await supabase
      .from('concursos')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Erro na inserção completa:', insertError);
      
      // Se falhar, tentar inserção em duas etapas
      console.log('\n2️⃣ Tentando inserção em duas etapas...');
      
      const basicData = {
        titulo: testData.titulo,
        orgao: testData.orgao,
        banca: testData.banca,
        status: testData.status
      };
      
      const { data: basicResult, error: basicError } = await supabase
        .from('concursos')
        .insert(basicData)
        .select();
        
      if (basicError) {
        console.error('❌ Erro na inserção básica:', basicError);
        return;
      }
      
      console.log('✅ Inserção básica bem-sucedida!');
      const concursoId = basicResult[0].id;
      
      // Segunda etapa: atualizar com campos JSONB
      const { error: updateError } = await supabase
        .from('concursos')
        .update({
          exam_type: testData.exam_type,
          has_minimum_score: testData.has_minimum_score,
          total_minimum_score: testData.total_minimum_score,
          wrong_answer_penalty: testData.wrong_answer_penalty,
          alternatives_count: testData.alternatives_count,
          has_custom_knowledge: testData.has_custom_knowledge,
          created_by_user_id: testData.created_by_user_id,
          disciplines: testData.disciplines,
          subjects: testData.subjects,
          form_config: testData.form_config,
          official_answers: testData.official_answers,
          exam_booklets: testData.exam_booklets,
          metadata: testData.metadata,
          total_participants: testData.total_participants
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
          console.log('📊 Disciplines:', finalData.disciplines);
          console.log('📊 Exam Booklets:', finalData.exam_booklets);
          console.log('📊 Form Config:', finalData.form_config);
          console.log('📊 Official Answers:', finalData.official_answers);
          console.log('📊 Metadata:', finalData.metadata);
        }
      }
      
    } else {
      console.log('🎉 Inserção completa bem-sucedida!');
      console.log('📊 Dados inseridos:', insertResult);
      
      // Verificar resultado
      const { data: finalData, error: finalError } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', insertResult[0].id)
        .single();
        
      if (finalError) {
        console.error('❌ Erro ao buscar resultado final:', finalError);
      } else {
        console.log('🎉 Resultado final:');
        console.log('📊 ID:', finalData.id);
        console.log('📊 Título:', finalData.titulo);
        console.log('📊 Disciplines:', finalData.disciplines);
        console.log('📊 Exam Booklets:', finalData.exam_booklets);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testConcursosJsonbComplete();

