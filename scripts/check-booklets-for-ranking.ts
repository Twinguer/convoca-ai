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

async function checkBookletsForRanking() {
  console.log('🔍 Verificando cadernos para o ranking: 405a0447-9c15-461d-9975-cec79a58522f\n');

  try {
    const rankingId = '405a0447-9c15-461d-9975-cec79a58522f';
    
    // 1. Verificar exam_booklets JSONB na tabela concursos
    console.log('1. Verificando exam_booklets JSONB na tabela concursos...');
    const { data: ranking, error: rankingError } = await supabase
      .from('concursos')
      .select('id, titulo, exam_booklets')
      .eq('id', rankingId)
      .single();
    
    if (rankingError) {
      console.error('❌ Erro ao buscar ranking:', rankingError);
      return;
    }
    
    console.log('✅ Ranking:', ranking.titulo);
    console.log('✅ exam_booklets JSONB:', JSON.stringify(ranking.exam_booklets, null, 2));
    
    if (!ranking.exam_booklets || ranking.exam_booklets.length === 0) {
      console.log('❌ PROBLEMA: exam_booklets JSONB está vazio ou null');
    } else {
      console.log('✅ exam_booklets JSONB tem', ranking.exam_booklets.length, 'cadernos');
    }
    
    // 2. Verificar tabela exam_booklets separada
    console.log('\n2. Verificando tabela exam_booklets separada...');
    const { data: bookletsTable, error: bookletsError } = await supabase
      .from('exam_booklets')
      .select('*')
      .eq('concurso_id', rankingId)
      .order('display_order');
    
    if (bookletsError) {
      console.error('❌ Erro ao buscar cadernos da tabela:', bookletsError);
    } else {
      console.log('✅ Cadernos na tabela exam_booklets:', bookletsTable?.length || 0);
      
      if (bookletsTable && bookletsTable.length > 0) {
        bookletsTable.forEach((booklet: any, index: number) => {
          console.log(`   ${index + 1}. ${booklet.name} (${booklet.id})`);
          console.log(`      - Display Order: ${booklet.display_order}`);
          console.log(`      - Is Active: ${booklet.is_active}`);
          console.log(`      - Total Questions: ${booklet.total_questions}`);
        });
        
        // 3. Migrar da tabela para JSONB se necessário
        if (!ranking.exam_booklets || ranking.exam_booklets.length === 0) {
          console.log('\n3. Migrando cadernos da tabela para JSONB...');
          
          const jsonbBooklets = bookletsTable.map((booklet: any) => ({
            id: booklet.id,
            name: booklet.name,
            display_order: booklet.display_order || 1,
            is_active: booklet.is_active !== false,
            total_questions: booklet.total_questions || 0
          }));
          
          console.log('✅ Cadernos processados para JSONB:', jsonbBooklets);
          
          const { error: updateError } = await supabase
            .from('concursos')
            .update({ exam_booklets: jsonbBooklets })
            .eq('id', rankingId);
          
          if (updateError) {
            console.error('❌ Erro ao atualizar JSONB:', updateError);
          } else {
            console.log('✅ JSONB atualizado com sucesso!');
            
            // Verificar se foi atualizado
            const { data: updatedRanking } = await supabase
              .from('concursos')
              .select('exam_booklets')
              .eq('id', rankingId)
              .single();
            
            console.log('✅ Verificação - exam_booklets após atualização:');
            console.log(JSON.stringify(updatedRanking?.exam_booklets, null, 2));
          }
        }
      } else {
        console.log('❌ Nenhum caderno encontrado na tabela exam_booklets');
      }
    }
    
    // 4. Verificar se há outros rankings com cadernos para referência
    console.log('\n4. Verificando outros rankings com cadernos...');
    const { data: otherRankings } = await supabase
      .from('concursos')
      .select('id, titulo, exam_booklets')
      .not('exam_booklets', 'is', null)
      .limit(3);
    
    if (otherRankings && otherRankings.length > 0) {
      console.log('✅ Rankings com cadernos encontrados:');
      otherRankings.forEach((r: any, index: number) => {
        console.log(`   ${index + 1}. ${r.titulo} (${r.id})`);
        console.log(`      - Cadernos: ${r.exam_booklets?.length || 0}`);
      });
    }
    
    console.log('\n🎯 DIAGNÓSTICO FINAL:');
    console.log('=' .repeat(50));
    
    if (!ranking.exam_booklets || ranking.exam_booklets.length === 0) {
      if (bookletsTable && bookletsTable.length > 0) {
        console.log('✅ SOLUÇÃO: Cadernos existem na tabela, mas não no JSONB');
        console.log('   - Migração automática foi executada');
        console.log('   - Agora o frontend deve conseguir carregar os cadernos');
      } else {
        console.log('❌ PROBLEMA: Nenhum caderno encontrado em lugar nenhum');
        console.log('   - O ranking precisa ter cadernos criados');
        console.log('   - Use a interface de criação de ranking para adicionar cadernos');
      }
    } else {
      console.log('✅ Ranking tem cadernos no JSONB - problema pode ser no frontend');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

checkBookletsForRanking();



