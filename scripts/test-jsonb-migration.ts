import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai do arquivo conv.env
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testJsonbMigration() {
  console.log('🧪 Testando migração para JSONB...\n');

  try {
    // 1. Testar busca de cadernos do JSONB
    console.log('1. Testando busca de cadernos do JSONB...');
    const { data: concursos, error: concursosError } = await supabase
      .from('concursos')
      .select('id, titulo, exam_booklets')
      .limit(3);

    if (concursosError) {
      console.error('❌ Erro ao buscar concursos:', concursosError);
      return;
    }

    console.log(`✅ Encontrados ${concursos?.length || 0} concursos`);
    
    for (const concurso of concursos || []) {
      console.log(`   - ${concurso.titulo}: ${concurso.exam_booklets?.length || 0} cadernos no JSONB`);
    }

    // 2. Testar busca de gabarito oficial do JSONB
    console.log('\n2. Testando busca de gabarito oficial do JSONB...');
    const { data: concursoWithAnswers, error: answersError } = await supabase
      .from('concursos')
      .select('id, titulo, official_answers')
      .not('official_answers', 'is', null)
      .limit(1)
      .single();

    if (answersError) {
      console.log('⚠️  Nenhum concurso com gabarito oficial encontrado');
    } else {
      console.log(`✅ Concurso "${concursoWithAnswers.titulo}" tem gabarito oficial`);
      const bookletIds = Object.keys(concursoWithAnswers.official_answers || {});
      console.log(`   - Cadernos com gabarito: ${bookletIds.join(', ')}`);
    }

    // 3. Verificar se ainda há dados nas tabelas antigas
    console.log('\n3. Verificando tabelas antigas...');
    
    const { data: oldBooklets, error: oldBookletsError } = await supabase
      .from('exam_booklets')
      .select('id, name, concurso_id')
      .limit(5);

    if (oldBookletsError) {
      console.log('✅ Tabela exam_booklets não acessível ou vazia');
    } else {
      console.log(`⚠️  Ainda há ${oldBooklets?.length || 0} cadernos na tabela antiga`);
    }

    const { data: oldWeights, error: oldWeightsError } = await supabase
      .from('official_answer_weights')
      .select('id, concurso_id')
      .limit(5);

    if (oldWeightsError) {
      console.log('✅ Tabela official_answer_weights não acessível ou vazia');
    } else {
      console.log(`⚠️  Ainda há ${oldWeights?.length || 0} registros na tabela antiga`);
    }

    // 4. Testar criação de novo ranking
    console.log('\n4. Testando criação de novo ranking...');
    const testRanking = {
      titulo: 'Teste JSONB Migration',
      orgao: 'Teste',
      banca: 'Teste',
      status: 'Ativo',
      exam_type: 'Objetiva',
      has_minimum_score: false,
      total_minimum_score: 0,
      wrong_answer_penalty: 0,
      alternatives_count: 4,
      has_custom_knowledge: false,
      created_by_user_id: null,
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
      .select('id')
      .single();

    if (createError) {
      console.error('❌ Erro ao criar ranking de teste:', createError);
    } else {
      console.log(`✅ Ranking de teste criado: ${newRanking.id}`);
      
      // Limpar o ranking de teste
      await supabase.from('concursos').delete().eq('id', newRanking.id);
      console.log('✅ Ranking de teste removido');
    }

    console.log('\n🎉 Teste de migração JSONB concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testJsonbMigration();
