import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteRankingCreation() {
  console.log('🧪 Testando criação de ranking com dados completos...\n');

  try {
    // 1. Dados básicos do ranking
    const basicData = {
      titulo: 'Teste Ranking Completo',
      orgao: 'Teste',
      banca: 'Teste',
      status: 'Ativo',
      exam_type: 'Alternativas',
      has_minimum_score: false,
      total_minimum_score: 0,
      wrong_answer_penalty: 0,
      alternatives_count: 4,
      has_custom_knowledge: false,
      created_by_user_id: null
    };

    // 2. Dados JSONB completos
    const jsonbData = {
      disciplines: [
        {
          id: 'disc-1',
          name: 'Matemática',
          questionCount: 10,
          weight: 1,
          isEnabled: true
        },
        {
          id: 'disc-2', 
          name: 'Português',
          questionCount: 15,
          weight: 1,
          isEnabled: true
        }
      ],
      subjects: [
        { id: 'subj-1', name: 'Álgebra' },
        { id: 'subj-2', name: 'Gramática' }
      ],
      exam_booklets: [
        {
          id: 'booklet-1',
          name: 'Caderno A',
          display_order: 1,
          is_active: true,
          total_questions: 25
        },
        {
          id: 'booklet-2',
          name: 'Caderno B', 
          display_order: 2,
          is_active: true,
          total_questions: 25
        }
      ],
      official_answers: {
        'booklet-1': {
          questions: {
            '1': { correct_answer: 'A', weight: 1 },
            '2': { correct_answer: 'B', weight: 1 },
            '3': { correct_answer: 'C', weight: 1 }
          }
        },
        'booklet-2': {
          questions: {
            '1': { correct_answer: 'D', weight: 1 },
            '2': { correct_answer: 'E', weight: 1 },
            '3': { correct_answer: 'A', weight: 1 }
          }
        }
      },
      form_config: {
        version: '1.0',
        created_at: new Date().toISOString()
      },
      metadata: {
        source: 'test',
        version: '1.0'
      },
      total_participants: 0
    };

    // 3. Criar ranking com dados básicos
    console.log('1. Criando ranking com dados básicos...');
    const { data: newRanking, error: createError } = await supabase
      .from('concursos')
      .insert(basicData)
      .select('id')
      .single();

    if (createError) {
      console.error('❌ Erro ao criar ranking:', createError);
      return;
    }

    console.log(`✅ Ranking criado: ${newRanking.id}`);

    // 4. Atualizar com dados JSONB
    console.log('\n2. Atualizando com dados JSONB...');
    const { error: updateError } = await supabase
      .from('concursos')
      .update(jsonbData)
      .eq('id', newRanking.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar com dados JSONB:', updateError);
      return;
    }

    console.log('✅ Dados JSONB atualizados');

    // 5. Verificar se os dados foram salvos
    console.log('\n3. Verificando dados salvos...');
    const { data: savedRanking, error: fetchError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', newRanking.id)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar ranking:', fetchError);
      return;
    }

    console.log('✅ Dados verificados:');
    console.log(`   - Disciplinas: ${savedRanking.disciplines?.length || 0}`);
    console.log(`   - Cadernos: ${savedRanking.exam_booklets?.length || 0}`);
    console.log(`   - Gabaritos: ${Object.keys(savedRanking.official_answers || {}).length}`);
    console.log(`   - Subjects: ${savedRanking.subjects?.length || 0}`);

    // 6. Testar busca de gabarito
    console.log('\n4. Testando busca de gabarito...');
    const bookletId = 'booklet-1';
    const answers = savedRanking.official_answers?.[bookletId];
    
    if (answers?.questions) {
      console.log(`✅ Gabarito encontrado para caderno ${bookletId}: ${Object.keys(answers.questions).length} questões`);
    } else {
      console.log(`❌ Gabarito não encontrado para caderno ${bookletId}`);
    }

    // 7. Limpar dados de teste
    console.log('\n5. Limpando dados de teste...');
    const { error: deleteError } = await supabase
      .from('concursos')
      .delete()
      .eq('id', newRanking.id);

    if (deleteError) {
      console.error('❌ Erro ao deletar ranking de teste:', deleteError);
    } else {
      console.log('✅ Ranking de teste removido');
    }

    console.log('\n🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testCompleteRankingCreation();



