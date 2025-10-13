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

async function testNewBookletCreation() {
  console.log('🧪 Testando criação de novo caderno após correção...\n');

  try {
    const concursoId = 'f2522ebf-efb5-4e4f-a543-75364c830c88';
    
    // 1. Estado atual
    console.log('1. Estado atual...');
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
    const { data: tableBooklets, error: tableError } = await supabase
      .from('exam_booklets')
      .select('*')
      .eq('concurso_id', concursoId)
      .order('display_order');

    if (tableError) {
      console.error('❌ Erro ao buscar tabela:', tableError);
    } else {
      console.log(`📚 Cadernos na tabela: ${tableBooklets?.length || 0}`);
    }

    // 3. Simular criação via frontend (como o ParticipationForm corrigido)
    console.log('\n2. Simulando criação via frontend corrigido...');
    const newBooklet = {
      id: crypto.randomUUID(),
      name: 'NOVO CADERNO FRONTEND',
      display_order: currentBooklets.length + 1,
      is_active: true,
      total_questions: 0
    };

    const updatedBooklets = [...currentBooklets, newBooklet];

    const { error: updateError } = await supabase
      .from('concursos')
      .update({ exam_booklets: updatedBooklets })
      .eq('id', concursoId);

    if (updateError) {
      console.error('❌ Erro ao salvar via frontend:', updateError);
      return;
    }

    console.log('✅ Caderno criado via frontend (atualização direta do JSONB)');

    // 4. Verificar se foi salvo no JSONB
    console.log('\n3. Verificando se foi salvo no JSONB...');
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
      
      const hasNewBooklet = newBooklets.some((b: any) => b.name === 'NOVO CADERNO FRONTEND');
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
    console.log('\n4. Verificando se foi criado na tabela exam_booklets...');
    const { data: finalTableBooklets, error: finalTableError } = await supabase
      .from('exam_booklets')
      .select('*')
      .eq('concurso_id', concursoId)
      .order('display_order');

    if (finalTableError) {
      console.error('❌ Erro ao verificar tabela final:', finalTableError);
    } else {
      const hasNewInTable = finalTableBooklets?.some((b: any) => b.name === 'NOVO CADERNO FRONTEND');
      console.log(`📚 Cadernos na tabela após criação: ${finalTableBooklets?.length || 0}`);
      
      if (hasNewInTable) {
        console.log('❌ PROBLEMA: Novo caderno foi criado na tabela exam_booklets!');
        console.log('   Isso significa que ainda há código usando a tabela antiga.');
      } else {
        console.log('✅ CORRETO: Novo caderno NÃO foi criado na tabela exam_booklets');
        console.log('   O sistema está usando apenas o JSONB como esperado.');
      }
    }

    console.log('\n🎉 Teste de criação após correção concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testNewBookletCreation();



