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

async function testCreateNewBooklet() {
  console.log('🧪 Testando criação de novo caderno...\n');

  try {
    const concursoId = 'f2522ebf-efb5-4e4f-a543-75364c830c88';
    
    // 1. Verificar estado atual
    console.log('1. Estado atual dos cadernos...');
    const { data: currentConcurso, error: currentError } = await supabase
      .from('concursos')
      .select('exam_booklets')
      .eq('id', concursoId)
      .single();

    if (currentError) {
      console.error('❌ Erro ao buscar concurso:', currentError);
      return;
    }

    const currentBooklets = currentConcurso?.exam_booklets || [];
    console.log(`📚 Cadernos atuais no JSONB: ${currentBooklets.length}`);
    currentBooklets.forEach((booklet: any, index: number) => {
      console.log(`   ${index + 1}. ${booklet.name} (${booklet.id})`);
    });

    // 2. Verificar tabela exam_booklets
    console.log('\n2. Estado atual da tabela exam_booklets...');
    const { data: tableBooklets, error: tableError } = await supabase
      .from('exam_booklets')
      .select('*')
      .eq('concurso_id', concursoId)
      .order('display_order');

    if (tableError) {
      console.error('❌ Erro ao buscar tabela:', tableError);
    } else {
      console.log(`📚 Cadernos na tabela: ${tableBooklets?.length || 0}`);
      tableBooklets?.forEach((booklet: any, index: number) => {
        console.log(`   ${index + 1}. ${booklet.name} (${booklet.id})`);
      });
    }

    // 3. Criar novo caderno via RPC (simulando frontend)
    console.log('\n3. Criando novo caderno via RPC...');
    const newBooklet = {
      id: crypto.randomUUID(),
      name: 'Novo Caderno Teste',
      display_order: currentBooklets.length + 1,
      is_active: true,
      total_questions: 0
    };

    const updatedBooklets = [...currentBooklets, newBooklet];

    const { data: rpcResult, error: rpcError } = await supabase.rpc('manage_exam_booklets_v2', {
      p_operation: 'SAVE_ALL',
      p_concurso_id: concursoId,
      p_booklets: updatedBooklets
    });

    if (rpcError) {
      console.error('❌ Erro ao salvar via RPC:', rpcError);
      return;
    }

    console.log('✅ Caderno criado via RPC:', rpcResult);

    // 4. Verificar se foi salvo no JSONB
    console.log('\n4. Verificando se foi salvo no JSONB...');
    const { data: updatedConcurso, error: updatedError } = await supabase
      .from('concursos')
      .select('exam_booklets')
      .eq('id', concursoId)
      .single();

    if (updatedError) {
      console.error('❌ Erro ao verificar JSONB:', updatedError);
    } else {
      const newBooklets = updatedConcurso?.exam_booklets || [];
      console.log(`📚 Cadernos no JSONB após criação: ${newBooklets.length}`);
      
      const hasNewBooklet = newBooklets.some((b: any) => b.name === 'Novo Caderno Teste');
      if (hasNewBooklet) {
        console.log('✅ Novo caderno encontrado no JSONB!');
        newBooklets.forEach((booklet: any, index: number) => {
          console.log(`   ${index + 1}. ${booklet.name} (${booklet.id})`);
        });
      } else {
        console.log('❌ Novo caderno NÃO encontrado no JSONB!');
      }
    }

    // 5. Verificar se foi criado na tabela exam_booklets
    console.log('\n5. Verificando se foi criado na tabela exam_booklets...');
    const { data: finalTableBooklets, error: finalTableError } = await supabase
      .from('exam_booklets')
      .select('*')
      .eq('concurso_id', concursoId)
      .order('display_order');

    if (finalTableError) {
      console.error('❌ Erro ao verificar tabela final:', finalTableError);
    } else {
      const hasNewInTable = finalTableBooklets?.some((b: any) => b.name === 'Novo Caderno Teste');
      console.log(`📚 Cadernos na tabela após criação: ${finalTableBooklets?.length || 0}`);
      
      if (hasNewInTable) {
        console.log('❌ PROBLEMA: Novo caderno foi criado na tabela exam_booklets!');
        console.log('   Isso significa que o sistema ainda está usando a tabela antiga.');
      } else {
        console.log('✅ CORRETO: Novo caderno NÃO foi criado na tabela exam_booklets');
        console.log('   O sistema está usando apenas o JSONB como esperado.');
      }
    }

    // 6. Testar criação via frontend (simulando ExamBookletsSection)
    console.log('\n6. Testando criação via frontend (ExamBookletsSection)...');
    const frontendBooklets = [
      ...currentBooklets,
      {
        id: crypto.randomUUID(),
        name: 'Frontend Caderno Teste',
        display_order: currentBooklets.length + 2,
        is_active: true,
        total_questions: 0
      }
    ];

    const { error: frontendError } = await supabase
      .from('concursos')
      .update({ exam_booklets: frontendBooklets })
      .eq('id', concursoId);

    if (frontendError) {
      console.error('❌ Erro ao salvar via frontend:', frontendError);
    } else {
      console.log('✅ Caderno criado via frontend (atualização direta do JSONB)');
    }

    console.log('\n🎉 Teste de criação concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testCreateNewBooklet();



