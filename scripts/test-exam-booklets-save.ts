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

async function testExamBookletsSave() {
  console.log('🧪 Testando salvamento de cadernos no JSONB...\n');

  try {
    // 1. Buscar um concurso existente
    console.log('1. Buscando concurso existente...');
    const { data: concursos, error: concursosError } = await supabase
      .from('concursos')
      .select('id, titulo, exam_booklets')
      .limit(1);

    if (concursosError || !concursos || concursos.length === 0) {
      console.error('❌ Nenhum concurso encontrado:', concursosError);
      return;
    }

    const concurso = concursos[0];
    console.log(`✅ Concurso encontrado: ${concurso.titulo} (${concurso.id})`);
    console.log(`📚 Cadernos atuais:`, JSON.stringify(concurso.exam_booklets, null, 2));

    // 2. Testar salvamento via função RPC
    console.log('\n2. Testando salvamento via função RPC...');
    const testBooklets = [
      {
        id: crypto.randomUUID(),
        name: 'Teste Caderno 1',
        display_order: 1,
        is_active: true,
        total_questions: 0
      },
      {
        id: crypto.randomUUID(),
        name: 'Teste Caderno 2',
        display_order: 2,
        is_active: true,
        total_questions: 0
      }
    ];

    const { data: rpcResult, error: rpcError } = await supabase.rpc('manage_exam_booklets_v2', {
      p_operation: 'SAVE_ALL',
      p_concurso_id: concurso.id,
      p_booklets: testBooklets
    });

    if (rpcError) {
      console.error('❌ Erro ao salvar via RPC:', rpcError);
    } else {
      console.log('✅ Salvamento via RPC bem-sucedido:', rpcResult);
    }

    // 3. Verificar se foi salvo corretamente
    console.log('\n3. Verificando se foi salvo corretamente...');
    const { data: updatedConcurso, error: fetchError } = await supabase
      .from('concursos')
      .select('exam_booklets')
      .eq('id', concurso.id)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar concurso atualizado:', fetchError);
    } else {
      console.log('✅ Cadernos salvos no JSONB:', JSON.stringify(updatedConcurso.exam_booklets, null, 2));
      
      // Verificar se os nomes estão corretos
      const savedBooklets = updatedConcurso.exam_booklets || [];
      const hasTestBooklet1 = savedBooklets.some((b: any) => b.name === 'Teste Caderno 1');
      const hasTestBooklet2 = savedBooklets.some((b: any) => b.name === 'Teste Caderno 2');
      
      if (hasTestBooklet1 && hasTestBooklet2) {
        console.log('🎉 Sucesso! Os cadernos foram salvos corretamente no JSONB!');
      } else {
        console.log('❌ Os cadernos de teste não foram encontrados no JSONB');
      }
    }

    // 4. Testar busca via RPC
    console.log('\n4. Testando busca via RPC...');
    const { data: getResult, error: getError } = await supabase.rpc('manage_exam_booklets_v2', {
      p_operation: 'GET',
      p_concurso_id: concurso.id
    });

    if (getError) {
      console.error('❌ Erro ao buscar via RPC:', getError);
    } else {
      console.log('✅ Busca via RPC bem-sucedida:', JSON.stringify(getResult, null, 2));
    }

    console.log('\n🎉 Teste de salvamento concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testExamBookletsSave();
