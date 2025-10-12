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

async function testUseSaveRankingFix() {
  console.log('🧪 TESTANDO CORREÇÃO DO useSaveRanking');
  console.log('=' .repeat(60));

  try {
    // Simular dados do formulário
    const formValues = {
      titulo: 'TESTE USESAVERANKING FIX',
      orgao: 'TESTE ORGÃO FIX',
      banca: 'TESTE BANCA FIX',
      status: 'Ativo',
      exam_type: 'Alternativas',
      has_minimum_score: false,
      total_minimum_score: 0,
      wrong_answer_penalty: 0.25,
      alternatives_count: 5,
      disciplines: [
        {
          id: 'test-discipline-fix-1',
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
      metadata: {}
    };

    const userId = '34d22725-d158-4d75-9089-efd049a1fb98';

    // Primeira etapa: inserir dados básicos (como no useSaveRanking.ts corrigido)
    console.log('1️⃣ Inserindo dados básicos...');
    const dataToSubmit = {
      titulo: formValues.titulo,
      orgao: formValues.orgao,
      banca: formValues.banca,
      status: formValues.status || 'Ativo'
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('concursos')
      .insert(dataToSubmit)
      .select();

    if (insertError) {
      console.error('❌ Erro na inserção básica:', insertError);
      return;
    }

    console.log('✅ Inserção básica bem-sucedida!');
    console.log('📊 Dados inseridos:', insertResult);

    const concursoId = insertResult[0].id;

    // Segunda etapa: atualizar com campos adicionais (sem JSONB)
    console.log('\n2️⃣ Atualizando com campos adicionais...');
    const { error: updateError } = await supabase
      .from('concursos')
      .update({ 
        exam_type: formValues.exam_type || 'Alternativas',
        has_minimum_score: formValues.has_minimum_score === true,
        total_minimum_score: formValues.has_minimum_score ? formValues.total_minimum_score : 0,
        wrong_answer_penalty: formValues.wrong_answer_penalty
      })
      .eq('id', concursoId);

    if (updateError) {
      console.error('❌ Erro na atualização:', updateError);
    } else {
      console.log('✅ Atualização bem-sucedida!');
      
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
        console.log('📊 Exam Type:', finalData.exam_type);
        console.log('📊 Disciplines:', finalData.disciplines);
        console.log('📊 Created By:', finalData.created_by_user_id);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testUseSaveRankingFix();
