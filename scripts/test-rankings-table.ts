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

async function testRankingsTable() {
  console.log('🧪 TESTANDO TABELA RANKINGS COM JSONB');
  console.log('=' .repeat(60));

  try {
    // 1. Tentar inserção completa na tabela rankings
    console.log('1️⃣ Tentando inserção completa na tabela rankings...');
    const { data: insertData, error: insertError } = await supabase
      .from('rankings')
      .insert({
        titulo: 'TESTE RANKINGS COMPLETO',
        orgao: 'TESTE ORGÃO RANKINGS',
        banca: 'TESTE BANCA RANKINGS',
        status: 'Ativo',
        exam_type: 'Alternativas',
        has_minimum_score: false,
        total_minimum_score: 0,
        wrong_answer_penalty: 0.25,
        alternatives_count: 5,
        has_custom_knowledge: true,
        created_by: '34d22725-d158-4d75-9089-efd049a1fb98',
        disciplines: [
          {
            id: 'test-rankings-1',
            name: 'Matemática',
            type: 'basic_knowledge',
            isEnabled: true,
            questionCount: 10,
            weight: 1.0,
            minimum_score: 0
          },
          {
            id: 'test-rankings-2',
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
            id: 'booklet-rankings-1',
            name: 'Caderno A',
            total_questions: 25
          },
          {
            id: 'booklet-rankings-2',
            name: 'Caderno B',
            total_questions: 30
          }
        ],
        metadata: {
          created_by_admin: false,
          version: '1.0',
          source: 'rankings_test',
          features: ['jsonb_test', 'complete_insertion']
        },
        total_participants: 0
      })
      .select();

    if (insertError) {
      console.error('❌ Erro na inserção completa:', insertError);
      
      // Se falhar, tentar inserção em duas etapas
      console.log('\n2️⃣ Tentando inserção em duas etapas...');
      
      const basicData = {
        titulo: 'TESTE RANKINGS BÁSICO',
        orgao: 'TESTE ORGÃO BÁSICO',
        banca: 'TESTE BANCA BÁSICO',
        status: 'Ativo',
        exam_type: 'Alternativas',
        has_minimum_score: false,
        total_minimum_score: 0,
        wrong_answer_penalty: 0.25,
        alternatives_count: 5,
        has_custom_knowledge: true,
        created_by: '34d22725-d158-4d75-9089-efd049a1fb98'
      };
      
      const { data: basicResult, error: basicError } = await supabase
        .from('rankings')
        .insert(basicData)
        .select();
        
      if (basicError) {
        console.error('❌ Erro na inserção básica:', basicError);
        return;
      }
      
      console.log('✅ Inserção básica bem-sucedida!');
      const rankingId = basicResult[0].id;
      
      // Segunda etapa: atualizar com campos JSONB
      const { error: updateError } = await supabase
        .from('rankings')
        .update({
          disciplines: [
            {
              id: 'test-rankings-basic-1',
              name: 'História',
              type: 'specific_knowledge_1',
              isEnabled: true,
              questionCount: 15,
              weight: 1.5,
              minimum_score: 0
            }
          ],
          subjects: [{ name: 'História Geral' }],
          form_config: { basic_test: true },
          official_answers: { '1': 'B', '2': 'C' },
          exam_booklets: [{ id: 'b1', name: 'Caderno B', total_questions: 15 }],
          metadata: { source: 'basic_test' },
          total_participants: 0
        })
        .eq('id', rankingId);
        
      if (updateError) {
        console.error('❌ Erro na atualização com JSONB:', updateError);
      } else {
        console.log('✅ Atualização com JSONB bem-sucedida!');
        
        // Verificar resultado final
        const { data: finalData, error: finalError } = await supabase
          .from('rankings')
          .select('*')
          .eq('id', rankingId)
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
      
    } else {
      console.log('🎉 Inserção completa bem-sucedida!');
      console.log('📊 Dados inseridos:', insertData);
      
      // Verificar resultado
      const { data: finalData, error: finalError } = await supabase
        .from('rankings')
        .select('*')
        .eq('id', insertData[0].id)
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

testRankingsTable();

