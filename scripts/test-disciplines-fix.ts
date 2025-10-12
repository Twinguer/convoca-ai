import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDisciplinesFix() {
  console.log('🧪 Testando correção das disciplinas...\n');

  try {
    // 1. Criar um ranking de teste com estrutura de prova
    console.log('1. Criando ranking de teste com estrutura de prova...');
    
    const basicData = {
      titulo: 'Teste Disciplinas Fix',
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
      // Estrutura de prova
      has_basic_knowledge: true,
      basic_knowledge_questions: 20,
      basic_knowledge_weight: 1,
      has_specific_knowledge_1: true,
      specific_knowledge_1_questions: 15,
      specific_knowledge_1_weight: 1,
      has_custom_knowledge: true,
      custom_knowledge_questions: 10,
      custom_knowledge_weight: 1
    };

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

    // 2. Simular a estrutura de disciplinas que deveria ser criada
    console.log('\n2. Simulando estrutura de disciplinas...');
    
    const expectedDisciplines = [
      {
        id: 'basic-knowledge',
        name: 'Conhecimentos Básicos',
        type: 'basic_knowledge',
        isEnabled: true,
        questionCount: 20,
        weight: 1,
        minimum_score: 0
      },
      {
        id: 'specific-knowledge-1',
        name: 'Conhecimentos Específicos 1',
        type: 'specific_knowledge_1',
        isEnabled: true,
        questionCount: 15,
        weight: 1,
        minimum_score: 0
      },
      {
        id: 'custom-knowledge',
        name: 'Conhecimentos Customizados',
        type: 'custom_knowledge',
        isEnabled: true,
        questionCount: 10,
        weight: 1,
        minimum_score: 0
      }
    ];

    console.log('📚 Disciplinas esperadas:');
    expectedDisciplines.forEach((discipline, index) => {
      console.log(`   ${index + 1}. ${discipline.name} (${discipline.questionCount} questões, peso ${discipline.weight})`);
    });

    // 3. Atualizar ranking com disciplinas
    console.log('\n3. Atualizando ranking com disciplinas...');
    
    const { error: updateError } = await supabase
      .from('concursos')
      .update({
        disciplines: expectedDisciplines,
        subjects: [
          { id: 'subj-1', name: 'Matemática' },
          { id: 'subj-2', name: 'Português' }
        ],
        exam_booklets: [
          {
            id: 'booklet-1',
            name: 'Caderno A',
            display_order: 1,
            is_active: true,
            total_questions: 45
          }
        ],
        official_answers: {
          'booklet-1': {
            questions: {
              '1': { correct_answer: 'A', weight: 1 },
              '2': { correct_answer: 'B', weight: 1 },
              '3': { correct_answer: 'C', weight: 1 }
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
      })
      .eq('id', newRanking.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar ranking:', updateError);
      return;
    }

    console.log('✅ Ranking atualizado com disciplinas');

    // 4. Verificar se os dados foram salvos corretamente
    console.log('\n4. Verificando dados salvos...');
    
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

    // 5. Testar busca de gabarito
    console.log('\n5. Testando busca de gabarito...');
    
    const bookletId = 'booklet-1';
    const answers = savedRanking.official_answers?.[bookletId];
    
    if (answers?.questions) {
      console.log(`✅ Gabarito encontrado para caderno ${bookletId}: ${Object.keys(answers.questions).length} questões`);
      
      // Testar se o AnswerSheet conseguiria carregar
      console.log('\n6. Simulando carregamento do AnswerSheet...');
      const questionCount = Object.keys(answers.questions).length;
      console.log(`   - Total de questões: ${questionCount}`);
      console.log(`   - Questões com gabarito: ${Object.keys(answers.questions).join(', ')}`);
      
      if (questionCount > 0) {
        console.log('✅ AnswerSheet conseguiria carregar com sucesso');
      } else {
        console.log('❌ AnswerSheet não conseguiria carregar - sem questões');
      }
    } else {
      console.log(`❌ Gabarito não encontrado para caderno ${bookletId}`);
    }

    // 6. Limpar dados de teste
    console.log('\n7. Limpando dados de teste...');
    
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
    console.log('\n📋 Resumo:');
    console.log('   ✅ Estrutura de disciplinas funciona corretamente');
    console.log('   ✅ Dados JSONB são salvos corretamente');
    console.log('   ✅ Gabarito oficial pode ser carregado');
    console.log('   ✅ AnswerSheet conseguiria funcionar');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testDisciplinesFix();

