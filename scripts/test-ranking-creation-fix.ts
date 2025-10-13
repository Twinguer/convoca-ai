import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRankingCreationFix() {
  console.log('🧪 Testando correção de criação de ranking...\n');

  try {
    // 1. Testar inserção básica na tabela concursos
    console.log('1. Testando inserção básica...');
    const testRanking = {
      titulo: 'Teste Correção Constraint',
      orgao: 'Teste',
      banca: 'Teste',
      status: 'Ativo',
      exam_type: 'Alternativas',
      has_minimum_score: false,
      total_minimum_score: 0,
      wrong_answer_penalty: 0,
      alternatives_count: 4,
      has_custom_knowledge: false,
      created_by_user_id: null,
      disciplines: [
        {
          id: 'test-discipline-1',
          name: 'Matemática',
          questionCount: 10,
          weight: 1,
          isEnabled: true
        }
      ],
      exam_booklets: [
        {
          id: 'test-booklet-1',
          name: 'Caderno Teste',
          display_order: 1,
          is_active: true,
          total_questions: 10
        }
      ],
      official_answers: {
        'test-booklet-1': {
          questions: {
            '1': { correct_answer: 'A', weight: 1 },
            '2': { correct_answer: 'B', weight: 1 }
          }
        }
      }
    };

    const { data: newRanking, error: createError } = await supabase
      .from('concursos')
      .insert(testRanking)
      .select('id, titulo')
      .single();

    if (createError) {
      console.error('❌ Erro ao criar ranking de teste:', createError);
      return;
    }

    console.log(`✅ Ranking de teste criado: ${newRanking.id} - ${newRanking.titulo}`);

    // 2. Testar atualização
    console.log('\n2. Testando atualização...');
    const { error: updateError } = await supabase
      .from('concursos')
      .update({ 
        titulo: 'Teste Correção Constraint - Atualizado',
        exam_type: 'Objetiva',
        has_minimum_score: true,
        total_minimum_score: 50
      })
      .eq('id', newRanking.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar ranking:', updateError);
    } else {
      console.log('✅ Ranking atualizado com sucesso');
    }

    // 3. Verificar se os dados foram salvos corretamente
    console.log('\n3. Verificando dados salvos...');
    const { data: savedRanking, error: fetchError } = await supabase
      .from('concursos')
      .select('id, titulo, exam_type, has_minimum_score, total_minimum_score, disciplines, exam_booklets, official_answers')
      .eq('id', newRanking.id)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar ranking:', fetchError);
    } else {
      console.log('✅ Dados salvos corretamente:');
      console.log(`   - Título: ${savedRanking.titulo}`);
      console.log(`   - Tipo: ${savedRanking.exam_type}`);
      console.log(`   - Nota mínima: ${savedRanking.has_minimum_score ? 'Sim' : 'Não'}`);
      console.log(`   - Disciplinas: ${savedRanking.disciplines?.length || 0}`);
      console.log(`   - Cadernos: ${savedRanking.exam_booklets?.length || 0}`);
      console.log(`   - Gabaritos: ${Object.keys(savedRanking.official_answers || {}).length}`);
    }

    // 4. Limpar dados de teste
    console.log('\n4. Limpando dados de teste...');
    const { error: deleteError } = await supabase
      .from('concursos')
      .delete()
      .eq('id', newRanking.id);

    if (deleteError) {
      console.error('❌ Erro ao deletar ranking de teste:', deleteError);
    } else {
      console.log('✅ Ranking de teste removido');
    }

    console.log('\n🎉 Teste de correção concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testRankingCreationFix();



