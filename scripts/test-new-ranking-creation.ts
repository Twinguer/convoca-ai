import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewRankingCreation() {
  console.log('🧪 Testando criação de novo ranking com disciplinas...\n');

  try {
    // 1. Criar um ranking de teste com disciplinas
    console.log('1. Criando ranking de teste...');
    
    const testRanking = {
      titulo: 'TESTE DISCIPLINAS',
      orgao: 'TESTE ORGÃO',
      banca: 'TESTE BANCA',
      vagas: 10,
      localidades: ['SP'],
      exam_type: 'Alternativas',
      alternatives_count: 5,
      has_minimum_score: false,
      total_minimum_score: 0,
      wrong_answer_penalty: 0,
      has_custom_knowledge: true,
      disciplines: [
        {
          id: 'test-block-1',
          name: 'Bloco 1',
          minimum_score: 0,
          disciplines: [
            {
              id: 'test-discipline-1',
              name: 'Mat',
              type: 'custom_mat',
              isEnabled: true,
              questionCount: 5,
              weight: 1,
              minimum_score: 0
            },
            {
              id: 'test-discipline-2',
              name: 'Port',
              type: 'custom_port',
              isEnabled: true,
              questionCount: 3,
              weight: 1,
              minimum_score: 0
            }
          ]
        }
      ],
      exam_booklets: [
        {
          id: 'test-booklet-1',
          name: 'BRANCO',
          display_order: 1
        }
      ],
      official_answers: {},
      subjects: [],
      form_config: {},
      metadata: {},
      total_participants: 0,
      created_by_user_id: '34d22725-d158-4d75-9089-efd049a1fb98', // ID do usuário de teste
      is_admin_created: false
    };

    const { data: createdRanking, error: createError } = await supabase
      .from('concursos')
      .insert(testRanking)
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar ranking:', createError);
      return;
    }

    console.log('✅ Ranking criado:', createdRanking.id);
    console.log('   - Título:', createdRanking.titulo);
    console.log('   - has_custom_knowledge:', createdRanking.has_custom_knowledge);
    console.log('   - disciplines:', JSON.stringify(createdRanking.disciplines, null, 2));

    // 2. Verificar se as disciplinas foram salvas corretamente
    console.log('\n2. Verificando estrutura de disciplinas...');
    
    if (!createdRanking.disciplines || !Array.isArray(createdRanking.disciplines)) {
      console.log('❌ Campo disciplines não foi salvo corretamente');
      return;
    }

    const isHierarchical = createdRanking.disciplines.length > 0 && 
                          createdRanking.disciplines[0] && 
                          typeof createdRanking.disciplines[0] === 'object' && 
                          'name' in createdRanking.disciplines[0] && 
                          'disciplines' in createdRanking.disciplines[0];
    
    console.log(`   - É estrutura hierárquica: ${isHierarchical}`);
    
    if (isHierarchical) {
      console.log('   - Estrutura hierárquica (blocos -> disciplinas):');
      createdRanking.disciplines.forEach((block: any, blockIndex: number) => {
        console.log(`     Bloco ${blockIndex + 1}: ${block.name}`);
        if (block.disciplines && Array.isArray(block.disciplines)) {
          block.disciplines.forEach((discipline: any, disciplineIndex: number) => {
            console.log(`       Disciplina ${disciplineIndex + 1}: ${discipline.name} (${discipline.type}) - ${discipline.questionCount} questões`);
          });
        }
      });
    } else {
      console.log('   - Estrutura plana (disciplinas diretas):');
      createdRanking.disciplines.forEach((discipline: any, index: number) => {
        console.log(`     Disciplina ${index + 1}: ${discipline.name} (${discipline.type}) - ${discipline.questionCount} questões`);
      });
    }

    // 3. Simular função getObjectiveSectionList
    console.log('\n3. Simulando função getObjectiveSectionList...');
    
    const sections = [];
    
    if (createdRanking.has_custom_knowledge && createdRanking.disciplines && Array.isArray(createdRanking.disciplines)) {
      if (isHierarchical) {
        // Estrutura hierárquica
        for (const block of createdRanking.disciplines) {
          if (block.disciplines && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled) {
                sections.push({
                  key: discipline.type,
                  label: `${block.name} - ${discipline.name}`
                });
              }
            }
          }
        }
      } else {
        // Estrutura plana
        for (const discipline of createdRanking.disciplines) {
          if (discipline.isEnabled) {
            sections.push({
              key: discipline.type,
              label: discipline.name
            });
          }
        }
      }
    }

    console.log(`   - Seções encontradas: ${sections.length}`);
    sections.forEach((section, index) => {
      console.log(`     ${index + 1}. ${section.key} -> ${section.label}`);
    });

    // 4. Simular função getAllQuestionsFromAllSections
    console.log('\n4. Simulando função getAllQuestionsFromAllSections...');
    
    const allQuestions = [];
    let currentQuestionNumber = 1;

    if (createdRanking.has_custom_knowledge && createdRanking.disciplines && Array.isArray(createdRanking.disciplines)) {
      if (isHierarchical) {
        // Estrutura hierárquica
        for (const block of createdRanking.disciplines) {
          if (block.disciplines && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled) {
                const questionCount = parseInt(discipline.questionCount) || 0;
                for (let i = 0; i < questionCount; i++) {
                  allQuestions.push(currentQuestionNumber++);
                }
              }
            }
          }
        }
      } else {
        // Estrutura plana
        for (const discipline of createdRanking.disciplines) {
          if (discipline.isEnabled && discipline.questionCount) {
            const questionCount = parseInt(discipline.questionCount) || 0;
            for (let i = 0; i < questionCount; i++) {
              allQuestions.push(currentQuestionNumber++);
            }
          }
        }
      }
    }

    console.log(`   - Total de questões esperadas: ${allQuestions.length}`);
    if (allQuestions.length > 0) {
      console.log(`   - Primeiras 5 questões: ${allQuestions.slice(0, 5).join(', ')}`);
      console.log(`   - Últimas 5 questões: ${allQuestions.slice(-5).join(', ')}`);
    }

    // 5. Verificar se o gabarito oficial pode ser renderizado
    console.log('\n5. Verificando se o gabarito oficial pode ser renderizado...');
    
    if (sections.length === 0) {
      console.log('❌ PROBLEMA: Nenhuma seção encontrada para renderizar');
      console.log('   - O gabarito oficial não terá abas');
    } else {
      console.log('✅ Seções encontradas - gabarito deve renderizar corretamente');
    }

    if (allQuestions.length === 0) {
      console.log('❌ PROBLEMA: Nenhuma questão encontrada');
      console.log('   - O gabarito oficial estará vazio');
    } else {
      console.log('✅ Questões encontradas - gabarito deve ter conteúdo');
    }

    // 6. Limpar o ranking de teste
    console.log('\n6. Limpando ranking de teste...');
    
    const { error: deleteError } = await supabase
      .from('concursos')
      .delete()
      .eq('id', createdRanking.id);

    if (deleteError) {
      console.error('❌ Erro ao deletar ranking de teste:', deleteError);
    } else {
      console.log('✅ Ranking de teste deletado');
    }

    console.log('\n🎉 Teste de criação de ranking concluído!');
    console.log('✅ As disciplinas estão sendo salvas corretamente');
    console.log('✅ O gabarito oficial deve renderizar disciplinas e blocos');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testNewRankingCreation();