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

async function migrateAllDataToJsonb() {
  console.log('🔄 MIGRANDO TODOS OS DADOS PARA JSONB...\n');

  try {
    // 1. Buscar todos os rankings que precisam de migração
    console.log('1. Identificando rankings que precisam de migração...');
    
    const { data: rankings, error: rankingsError } = await supabase
      .from('concursos')
      .select('id, titulo, exam_booklets, disciplines, official_answers')
      .order('created_at', { ascending: false });
    
    if (rankingsError) {
      console.error('❌ Erro ao buscar rankings:', rankingsError);
      return;
    }
    
    console.log(`✅ Encontrados ${rankings.length} rankings para verificar`);
    
    // 2. Para cada ranking, verificar e migrar dados
    for (const ranking of rankings) {
      console.log(`\n📋 Processando: ${ranking.titulo} (${ranking.id})`);
      
      let needsUpdate = false;
      const updates: any = {};
      
      // 3. Migrar exam_booklets
      if (!ranking.exam_booklets || ranking.exam_booklets.length === 0) {
        console.log('   🔄 Migrando exam_booklets...');
        
        const { data: booklets, error: bookletsError } = await supabase
          .from('exam_booklets')
          .select('*')
          .eq('concurso_id', ranking.id)
          .order('display_order');
        
        if (bookletsError) {
          console.error('   ❌ Erro ao buscar cadernos:', bookletsError);
        } else if (booklets && booklets.length > 0) {
          const jsonbBooklets = booklets.map((booklet: any) => ({
            id: booklet.id,
            name: booklet.name,
            display_order: booklet.display_order || 1,
            is_active: booklet.is_active !== false,
            total_questions: booklet.total_questions || 0
          }));
          
          updates.exam_booklets = jsonbBooklets;
          needsUpdate = true;
          console.log(`   ✅ ${jsonbBooklets.length} cadernos migrados`);
        } else {
          console.log('   ⚠️ Nenhum caderno encontrado na tabela antiga');
        }
      } else {
        console.log('   ✅ exam_booklets já tem dados no JSONB');
      }
      
      // 4. Migrar disciplines (se necessário)
      if (!ranking.disciplines || ranking.disciplines.length === 0) {
        console.log('   🔄 Migrando disciplines...');
        
        const { data: weights, error: weightsError } = await supabase
          .from('official_answer_weights')
          .select('*')
          .eq('concurso_id', ranking.id);
        
        if (weightsError) {
          console.error('   ❌ Erro ao buscar pesos:', weightsError);
        } else if (weights && weights.length > 0) {
          const jsonbDisciplines = weights.map((weight: any) => ({
            id: weight.id || crypto.randomUUID(),
            name: weight.discipline_name || 'Disciplina',
            weight: weight.weight || 1,
            minimum_score: weight.minimum_score || 0
          }));
          
          updates.disciplines = jsonbDisciplines;
          needsUpdate = true;
          console.log(`   ✅ ${jsonbDisciplines.length} disciplinas migradas`);
        } else {
          console.log('   ⚠️ Nenhuma disciplina encontrada na tabela antiga');
        }
      } else {
        console.log('   ✅ disciplines já tem dados no JSONB');
      }
      
      // 5. Migrar official_answers (se necessário)
      if (!ranking.official_answers || Object.keys(ranking.official_answers).length === 0) {
        console.log('   🔄 Migrando official_answers...');
        
        const { data: consolidated, error: consolidatedError } = await supabase
          .from('consolidated_answers_by_concurso')
          .select('consolidated_data')
          .eq('concurso_id', ranking.id)
          .maybeSingle();
        
        if (consolidatedError) {
          console.error('   ❌ Erro ao buscar dados consolidados:', consolidatedError);
        } else if (consolidated && consolidated.consolidated_data) {
          // Converter dados consolidados para formato official_answers
          const consolidatedData = consolidated.consolidated_data;
          const officialAnswers: any = {};
          
          // Processar dados consolidados para criar official_answers
          if (consolidatedData.booklets) {
            Object.keys(consolidatedData.booklets).forEach(bookletId => {
              const booklet = consolidatedData.booklets[bookletId];
              officialAnswers[bookletId] = {
                questions: booklet.questions || {},
                metadata: {
                  total_questions: booklet.total_questions || 0,
                  created_at: booklet.created_at || new Date().toISOString()
                }
              };
            });
          }
          
          if (Object.keys(officialAnswers).length > 0) {
            updates.official_answers = officialAnswers;
            needsUpdate = true;
            console.log(`   ✅ ${Object.keys(officialAnswers).length} cadernos de gabarito migrados`);
          } else {
            console.log('   ⚠️ Nenhum gabarito encontrado para migrar');
          }
        } else {
          console.log('   ⚠️ Nenhum dado consolidado encontrado');
        }
      } else {
        console.log('   ✅ official_answers já tem dados no JSONB');
      }
      
      // 6. Atualizar ranking se necessário
      if (needsUpdate) {
        console.log('   💾 Atualizando ranking com dados migrados...');
        
        const { error: updateError } = await supabase
          .from('concursos')
          .update(updates)
          .eq('id', ranking.id);
        
        if (updateError) {
          console.error('   ❌ Erro ao atualizar ranking:', updateError);
        } else {
          console.log('   ✅ Ranking atualizado com sucesso');
        }
      } else {
        console.log('   ✅ Ranking já está atualizado');
      }
    }
    
    // 7. Verificar resultado final
    console.log('\n🎯 VERIFICAÇÃO FINAL:');
    console.log('=' .repeat(50));
    
    const { data: finalRankings } = await supabase
      .from('concursos')
      .select('id, titulo, exam_booklets, disciplines, official_answers')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (finalRankings) {
      console.log('📊 Rankings após migração:');
      finalRankings.forEach((ranking: any, index: number) => {
        console.log(`\n   ${index + 1}. ${ranking.titulo}`);
        console.log(`      - exam_booklets: ${ranking.exam_booklets?.length || 0} cadernos`);
        console.log(`      - disciplines: ${ranking.disciplines?.length || 0} disciplinas`);
        console.log(`      - official_answers: ${ranking.official_answers ? Object.keys(ranking.official_answers).length : 0} cadernos`);
      });
    }
    
    // 8. Verificar se ainda há dados nas tabelas antigas
    console.log('\n📋 Verificando tabelas antigas...');
    
    const { data: remainingBooklets } = await supabase
      .from('exam_booklets')
      .select('concurso_id, name')
      .limit(5);
    
    const { data: remainingWeights } = await supabase
      .from('official_answer_weights')
      .select('concurso_id')
      .limit(5);
    
    console.log(`   - exam_booklets restantes: ${remainingBooklets?.length || 0}`);
    console.log(`   - official_answer_weights restantes: ${remainingWeights?.length || 0}`);
    
    if (remainingBooklets && remainingBooklets.length > 0) {
      console.log('   ⚠️ Ainda há dados nas tabelas antigas');
      console.log('   💡 Considere remover após confirmar que tudo funciona');
    } else {
      console.log('   ✅ Tabelas antigas estão vazias');
    }
    
    console.log('\n🎉 MIGRAÇÃO CONCLUÍDA!');
    console.log('=' .repeat(50));
    console.log('✅ Dados migrados para JSONB');
    console.log('✅ Sistema deve funcionar corretamente agora');
    console.log('📝 Próximo passo: Testar criação de novo ranking');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

migrateAllDataToJsonb();

