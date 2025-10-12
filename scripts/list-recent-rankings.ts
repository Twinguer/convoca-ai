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

async function listRecentRankings() {
  console.log('🔍 Listando rankings mais recentes...\n');

  try {
    // 1. Listar rankings mais recentes
    console.log('1. Rankings mais recentes (últimos 10):');
    const { data: recentRankings, error: recentError } = await supabase
      .from('concursos')
      .select('id, titulo, orgao, banca, status, created_at, exam_booklets, official_answers, disciplines')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (recentError) {
      console.error('❌ Erro ao buscar rankings recentes:', recentError);
      return;
    }
    
    if (!recentRankings || recentRankings.length === 0) {
      console.log('❌ Nenhum ranking encontrado');
      return;
    }
    
    recentRankings.forEach((ranking: any, index: number) => {
      console.log(`\n${index + 1}. ${ranking.titulo} (${ranking.id})`);
      console.log(`   - Órgão: ${ranking.orgao}`);
      console.log(`   - Banca: ${ranking.banca}`);
      console.log(`   - Status: ${ranking.status}`);
      console.log(`   - Criado: ${ranking.created_at}`);
      console.log(`   - exam_booklets JSONB: ${ranking.exam_booklets?.length || 0} cadernos`);
      console.log(`   - official_answers JSONB: ${ranking.official_answers ? 'Sim' : 'Não'}`);
      console.log(`   - disciplines JSONB: ${ranking.disciplines?.length || 0} disciplinas`);
    });
    
    // 2. Verificar dados nas tabelas antigas
    console.log('\n2. Verificando dados nas tabelas antigas...');
    
    // exam_booklets
    const { data: bookletsTable, error: bookletsError } = await supabase
      .from('exam_booklets')
      .select('concurso_id, name, display_order, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (bookletsError) {
      console.error('❌ Erro ao buscar cadernos da tabela:', bookletsError);
    } else {
      console.log('\n📋 Cadernos na tabela exam_booklets (últimos 10):');
      if (bookletsTable && bookletsTable.length > 0) {
        bookletsTable.forEach((booklet: any, index: number) => {
          console.log(`   ${index + 1}. ${booklet.name} (${booklet.concurso_id}) - Ordem: ${booklet.display_order}`);
        });
      } else {
        console.log('   Nenhum caderno encontrado');
      }
    }
    
    // official_answer_weights
    const { data: weightsTable, error: weightsError } = await supabase
      .from('official_answer_weights')
      .select('concurso_id, discipline_name, weight, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (weightsError) {
      console.error('❌ Erro ao buscar pesos da tabela:', weightsError);
    } else {
      console.log('\n📋 Pesos na tabela official_answer_weights (últimos 10):');
      if (weightsTable && weightsTable.length > 0) {
        weightsTable.forEach((weight: any, index: number) => {
          console.log(`   ${index + 1}. ${weight.discipline_name} (${weight.concurso_id}) - Peso: ${weight.weight}`);
        });
      } else {
        console.log('   Nenhum peso encontrado');
      }
    }
    
    // 3. Analisar o ranking mais recente em detalhes
    if (recentRankings.length > 0) {
      const latestRanking = recentRankings[0];
      console.log('\n3. Analisando ranking mais recente em detalhes:');
      console.log(`   ID: ${latestRanking.id}`);
      console.log(`   Título: ${latestRanking.titulo}`);
      
      // Verificar exam_booklets JSONB
      console.log('\n   📋 EXAM_BOOKLETS JSONB:');
      if (latestRanking.exam_booklets && Array.isArray(latestRanking.exam_booklets) && latestRanking.exam_booklets.length > 0) {
        console.log('   ✅ Tem dados:', latestRanking.exam_booklets.length, 'cadernos');
        latestRanking.exam_booklets.forEach((booklet: any, i: number) => {
          console.log(`      ${i + 1}. ${booklet.name || 'Sem nome'} (${booklet.id})`);
          console.log(`         - Display Order: ${booklet.display_order}`);
          console.log(`         - Is Active: ${booklet.is_active}`);
          console.log(`         - Total Questions: ${booklet.total_questions}`);
        });
      } else {
        console.log('   ❌ Vazio ou inválido');
      }
      
      // Verificar official_answers JSONB
      console.log('\n   📋 OFFICIAL_ANSWERS JSONB:');
      if (latestRanking.official_answers && typeof latestRanking.official_answers === 'object') {
        console.log('   ✅ Tem dados:', Object.keys(latestRanking.official_answers).length, 'cadernos');
        Object.keys(latestRanking.official_answers).forEach((bookletId, i) => {
          const booklet = latestRanking.official_answers[bookletId];
          console.log(`      ${i + 1}. Caderno ${bookletId}: ${booklet.questions ? Object.keys(booklet.questions).length : 0} questões`);
        });
      } else {
        console.log('   ❌ Vazio ou inválido');
      }
      
      // Verificar disciplines JSONB
      console.log('\n   📋 DISCIPLINES JSONB:');
      if (latestRanking.disciplines && Array.isArray(latestRanking.disciplines) && latestRanking.disciplines.length > 0) {
        console.log('   ✅ Tem dados:', latestRanking.disciplines.length, 'disciplinas');
        latestRanking.disciplines.forEach((d: any, i: number) => {
          console.log(`      ${i + 1}. ${d.name || d.discipline_name || 'Sem nome'} (Peso: ${d.weight || d.peso || 'N/A'})`);
        });
      } else {
        console.log('   ❌ Vazio ou inválido');
      }
      
      // Verificar se há dados correspondentes nas tabelas antigas
      console.log('\n   📊 COMPARAÇÃO COM TABELAS ANTIGAS:');
      
      const { data: bookletsForRanking } = await supabase
        .from('exam_booklets')
        .select('*')
        .eq('concurso_id', latestRanking.id);
      
      const { data: weightsForRanking } = await supabase
        .from('official_answer_weights')
        .select('*')
        .eq('concurso_id', latestRanking.id);
      
      console.log(`   - exam_booklets tabela: ${bookletsForRanking?.length || 0} cadernos`);
      console.log(`   - official_answer_weights tabela: ${weightsForRanking?.length || 0} registros`);
      
      if (bookletsForRanking && bookletsForRanking.length > 0) {
        console.log('   ⚠️ PROBLEMA: Dados ainda estão sendo salvos na tabela antiga!');
        console.log('   - Cadernos na tabela:', bookletsForRanking.map((b: any) => b.name));
      }
      
      if (weightsForRanking && weightsForRanking.length > 0) {
        console.log('   ⚠️ PROBLEMA: Pesos ainda estão sendo salvos na tabela antiga!');
        console.log('   - Pesos na tabela:', weightsForRanking.map((w: any) => w.discipline_name));
      }
    }
    
    console.log('\n🎯 DIAGNÓSTICO:');
    console.log('=' .repeat(50));
    console.log('Se o sistema não está salvando dados do caderno de resposta:');
    console.log('1. Verificar se useSaveRanking.ts está salvando no JSONB');
    console.log('2. Verificar se ExamBookletsSection.tsx está salvando no JSONB');
    console.log('3. Verificar se GeneralTab.tsx está salvando no JSONB');
    console.log('4. Verificar se há conflito entre tabelas antigas e JSONB');
    
  } catch (error) {
    console.error('❌ Erro durante a listagem:', error);
  }
}

listRecentRankings();

