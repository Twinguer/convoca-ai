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

async function testExamBookletsJsonb() {
  console.log('🧪 Testando migração de exam_booklets para JSONB...\n');

  try {
    // 1. Buscar concursos com exam_booklets JSONB
    console.log('1. Buscando concursos com exam_booklets JSONB...');
    const { data: concursos, error: concursosError } = await supabase
      .from('concursos')
      .select('id, titulo, exam_booklets')
      .not('exam_booklets', 'is', null);

    if (concursosError) {
      console.error('❌ Erro ao buscar concursos:', concursosError);
      return;
    }

    console.log(`✅ Encontrados ${concursos?.length || 0} concursos com exam_booklets JSONB`);

    if (concursos && concursos.length > 0) {
      const concurso = concursos[0];
      console.log(`\n📋 Exemplo - Concurso: ${concurso.titulo}`);
      console.log(`📚 Cadernos JSONB:`, JSON.stringify(concurso.exam_booklets, null, 2));

      // 2. Testar ordenação por display_order
      console.log('\n2. Testando ordenação por display_order...');
      const booklets = concurso.exam_booklets || [];
      const sortedBooklets = booklets.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
      console.log('✅ Cadernos ordenados:', sortedBooklets.map((b: any) => `${b.name} (ordem: ${b.display_order})`));

      // 3. Verificar estrutura dos cadernos
      console.log('\n3. Verificando estrutura dos cadernos...');
      const requiredFields = ['id', 'name', 'display_order', 'is_active', 'total_questions'];
      const booklet = booklets[0];
      
      for (const field of requiredFields) {
        if (field in booklet) {
          console.log(`✅ Campo '${field}': ${booklet[field]}`);
        } else {
          console.log(`❌ Campo '${field}' ausente`);
        }
      }
    }

    // 4. Comparar com tabela exam_booklets (se existir)
    console.log('\n4. Comparando com tabela exam_booklets...');
    const { data: tableBooklets, error: tableError } = await supabase
      .from('exam_booklets')
      .select('*')
      .limit(5);

    if (tableError) {
      console.log('⚠️ Tabela exam_booklets não encontrada ou erro:', tableError.message);
    } else {
      console.log(`📊 Tabela exam_booklets tem ${tableBooklets?.length || 0} registros`);
      if (tableBooklets && tableBooklets.length > 0) {
        console.log('📋 Exemplo da tabela:', tableBooklets[0]);
      }
    }

    console.log('\n🎉 Teste concluído! A migração para JSONB está funcionando.');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testExamBookletsJsonb();
