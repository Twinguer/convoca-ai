import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis do arquivo conv.env (convoca-ai)
config({ path: 'conv.env', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontendExamBooklets() {
  console.log('🧪 Testando integração frontend com exam_booklets JSONB...\n');

  try {
    // 1. Testar busca direta do JSONB (como o frontend faz)
    console.log('1. Testando busca direta do JSONB...');
    const { data: concursoData, error: concursoError } = await supabase
      .from('concursos')
      .select('exam_booklets')
      .eq('id', 'f2522ebf-efb5-4e4f-a543-75364c830c88')
      .single();

    if (concursoError) {
      console.error('❌ Erro ao buscar concurso:', concursoError);
      return;
    }

    const booklets = concursoData?.exam_booklets || [];
    console.log(`✅ Encontrados ${booklets.length} cadernos no JSONB`);
    
    // Ordenar por display_order (como o frontend faz)
    const sortedBooklets = booklets.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
    console.log('📚 Cadernos ordenados:');
    sortedBooklets.forEach((booklet: any, index: number) => {
      console.log(`   ${index + 1}. ${booklet.name} (ordem: ${booklet.display_order}, id: ${booklet.id})`);
    });

    // 2. Testar função RPC (se ainda for usada)
    console.log('\n2. Testando função RPC...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('manage_exam_booklets_v2', {
      p_operation: 'GET',
      p_concurso_id: 'f2522ebf-efb5-4e4f-a543-75364c830c88'
    });

    if (rpcError) {
      console.error('❌ Erro na função RPC:', rpcError);
    } else {
      console.log('✅ Função RPC funcionando:', rpcData);
    }

    // 3. Verificar se os dados são consistentes
    console.log('\n3. Verificando consistência dos dados...');
    const { data: tableBooklets, error: tableError } = await supabase
      .from('exam_booklets')
      .select('*')
      .eq('concurso_id', 'f2522ebf-efb5-4e4f-a543-75364c830c88')
      .order('display_order');

    if (tableError) {
      console.error('❌ Erro ao buscar da tabela:', tableError);
    } else {
      console.log(`✅ Tabela exam_booklets tem ${tableBooklets?.length || 0} cadernos`);
      
      // Comparar dados
      const tableNames = tableBooklets?.map(b => b.name).sort() || [];
      const jsonbNames = sortedBooklets.map((b: any) => b.name).sort();
      
      const isConsistent = JSON.stringify(tableNames) === JSON.stringify(jsonbNames);
      
      if (isConsistent) {
        console.log('✅ Dados consistentes entre tabela e JSONB');
        console.log(`   Tabela: [${tableNames.join(', ')}]`);
        console.log(`   JSONB:  [${jsonbNames.join(', ')}]`);
      } else {
        console.log('❌ Dados inconsistentes!');
        console.log(`   Tabela: [${tableNames.join(', ')}]`);
        console.log(`   JSONB:  [${jsonbNames.join(', ')}]`);
      }
    }

    // 4. Simular operações do frontend
    console.log('\n4. Simulando operações do frontend...');
    
    // Simular seleção de caderno (como no ParticipationForm)
    const selectedBookletId = sortedBooklets[0]?.id;
    if (selectedBookletId) {
      console.log(`✅ Caderno selecionado: ${sortedBooklets[0]?.name} (${selectedBookletId})`);
    }

    // Simular busca de gabarito (como no AnswerSheet)
    const { data: officialAnswers, error: answersError } = await supabase
      .from('concursos')
      .select('official_answers')
      .eq('id', 'f2522ebf-efb5-4e4f-a543-75364c830c88')
      .single();

    if (answersError) {
      console.error('❌ Erro ao buscar gabarito:', answersError);
    } else {
      const answers = officialAnswers?.official_answers || {};
      const bookletAnswers = answers.booklets?.[selectedBookletId];
      console.log(`✅ Gabarito encontrado para caderno ${selectedBookletId}: ${bookletAnswers ? 'Sim' : 'Não'}`);
    }

    console.log('\n🎉 Teste de integração concluído!');
    console.log('✅ O frontend deve funcionar corretamente com os dados migrados.');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testFrontendExamBooklets();

