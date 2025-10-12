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

async function migrateExamBookletsToJsonb() {
  console.log('🔄 Migrando dados da tabela exam_booklets para JSONB...\n');

  try {
    // 1. Buscar todos os concursos que têm cadernos na tabela exam_booklets
    console.log('1. Buscando concursos com cadernos na tabela exam_booklets...');
    const { data: concursosWithBooklets, error: concursosError } = await supabase
      .from('exam_booklets')
      .select(`
        concurso_id,
        concursos!inner(titulo, exam_booklets)
      `)
      .order('concurso_id');

    if (concursosError) {
      console.error('❌ Erro ao buscar concursos:', concursosError);
      return;
    }

    // Agrupar por concurso_id
    const concursosMap = new Map();
    concursosWithBooklets?.forEach(item => {
      if (!concursosMap.has(item.concurso_id)) {
        concursosMap.set(item.concurso_id, {
          id: item.concurso_id,
          titulo: item.concursos.titulo,
          exam_booklets: item.concursos.exam_booklets,
          booklets: []
        });
      }
    });

    console.log(`✅ Encontrados ${concursosMap.size} concursos com cadernos`);

    // 2. Buscar todos os cadernos da tabela exam_booklets
    console.log('\n2. Buscando cadernos da tabela exam_booklets...');
    const { data: allBooklets, error: bookletsError } = await supabase
      .from('exam_booklets')
      .select('*')
      .order('concurso_id, display_order');

    if (bookletsError) {
      console.error('❌ Erro ao buscar cadernos:', bookletsError);
      return;
    }

    console.log(`✅ Encontrados ${allBooklets?.length || 0} cadernos na tabela`);

    // 3. Agrupar cadernos por concurso
    allBooklets?.forEach(booklet => {
      if (concursosMap.has(booklet.concurso_id)) {
        concursosMap.get(booklet.concurso_id).booklets.push(booklet);
      }
    });

    // 4. Migrar cada concurso
    console.log('\n3. Migrando dados para JSONB...');
    let migratedCount = 0;
    let errorCount = 0;

    for (const [concursoId, concurso] of concursosMap) {
      try {
        console.log(`\n📋 Migrando concurso: ${concurso.titulo} (${concursoId})`);
        console.log(`   Cadernos encontrados: ${concurso.booklets.length}`);

        // Converter cadernos para formato JSONB
        const jsonbBooklets = concurso.booklets.map(booklet => ({
          id: booklet.id,
          name: booklet.name,
          display_order: booklet.display_order,
          is_active: true,
          total_questions: 0
        }));

        console.log(`   Cadernos JSONB:`, jsonbBooklets.map(b => `${b.name} (ordem: ${b.display_order})`));

        // Atualizar na tabela concursos
        const { error: updateError } = await supabase
          .from('concursos')
          .update({ exam_booklets: jsonbBooklets })
          .eq('id', concursoId);

        if (updateError) {
          console.error(`   ❌ Erro ao migrar:`, updateError.message);
          errorCount++;
        } else {
          console.log(`   ✅ Migrado com sucesso!`);
          migratedCount++;
        }

      } catch (error) {
        console.error(`   ❌ Erro ao processar concurso ${concursoId}:`, error);
        errorCount++;
      }
    }

    // 5. Verificar resultado
    console.log('\n4. Verificando migração...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('concursos')
      .select('id, titulo, exam_booklets')
      .not('exam_booklets', 'is', null);

    if (verifyError) {
      console.error('❌ Erro ao verificar migração:', verifyError);
    } else {
      console.log(`✅ Verificação concluída: ${verifyData?.length || 0} concursos com JSONB`);
      
      verifyData?.forEach(concurso => {
        const booklets = concurso.exam_booklets || [];
        console.log(`   📚 ${concurso.titulo}: ${booklets.length} cadernos`);
        booklets.forEach((booklet: any) => {
          console.log(`      - ${booklet.name} (ordem: ${booklet.display_order})`);
        });
      });
    }

    console.log(`\n🎉 Migração concluída!`);
    console.log(`   ✅ Concursos migrados: ${migratedCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

migrateExamBookletsToJsonb();

