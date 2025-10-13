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

async function checkJsonbContent() {
  console.log('🔍 Verificando conteúdo real dos JSONBs...\n');

  try {
    const rankingId = '405a0447-9c15-461d-9975-cec79a58522f';
    
    // 1. Verificar conteúdo dos JSONBs
    console.log('1. Verificando conteúdo dos JSONBs...');
    const { data: ranking, error: rankingError } = await supabase
      .from('concursos')
      .select('id, titulo, disciplines, subjects, form_config, official_answers, exam_booklets, metadata')
      .eq('id', rankingId)
      .single();
    
    if (rankingError) {
      console.error('❌ Erro ao buscar ranking:', rankingError);
      return;
    }
    
    console.log('✅ Ranking:', ranking.titulo);
    console.log('✅ ID:', ranking.id);
    
    // Verificar cada JSONB
    console.log('\n📋 DISCIPLINES:');
    if (ranking.disciplines && Array.isArray(ranking.disciplines) && ranking.disciplines.length > 0) {
      console.log('✅ Tem dados:', ranking.disciplines.length, 'disciplinas');
      ranking.disciplines.forEach((d: any, i: number) => {
        console.log(`   ${i + 1}. ${d.name || d.discipline_name || 'Sem nome'} (Peso: ${d.weight || d.peso || 'N/A'})`);
      });
    } else {
      console.log('❌ Vazio ou inválido:', JSON.stringify(ranking.disciplines));
    }
    
    console.log('\n📋 SUBJECTS:');
    if (ranking.subjects && Array.isArray(ranking.subjects) && ranking.subjects.length > 0) {
      console.log('✅ Tem dados:', ranking.subjects.length, 'assuntos');
      ranking.subjects.forEach((s: any, i: number) => {
        console.log(`   ${i + 1}. ${s.name || s.subject_name || 'Sem nome'}`);
      });
    } else {
      console.log('❌ Vazio ou inválido:', JSON.stringify(ranking.subjects));
    }
    
    console.log('\n📋 FORM_CONFIG:');
    if (ranking.form_config && typeof ranking.form_config === 'object') {
      console.log('✅ Tem dados:', Object.keys(ranking.form_config).length, 'campos');
      console.log('   - Campos:', Object.keys(ranking.form_config));
    } else {
      console.log('❌ Vazio ou inválido:', JSON.stringify(ranking.form_config));
    }
    
    console.log('\n📋 OFFICIAL_ANSWERS:');
    if (ranking.official_answers && typeof ranking.official_answers === 'object') {
      console.log('✅ Tem dados:', Object.keys(ranking.official_answers).length, 'cadernos');
      Object.keys(ranking.official_answers).forEach((bookletId, i) => {
        const booklet = ranking.official_answers[bookletId];
        console.log(`   ${i + 1}. Caderno ${bookletId}: ${booklet.questions ? Object.keys(booklet.questions).length : 0} questões`);
      });
    } else {
      console.log('❌ Vazio ou inválido:', JSON.stringify(ranking.official_answers));
    }
    
    console.log('\n📋 EXAM_BOOKLETS:');
    if (ranking.exam_booklets && Array.isArray(ranking.exam_booklets) && ranking.exam_booklets.length > 0) {
      console.log('✅ Tem dados:', ranking.exam_booklets.length, 'cadernos');
      ranking.exam_booklets.forEach((b: any, i: number) => {
        console.log(`   ${i + 1}. ${b.name || 'Sem nome'} (${b.id})`);
        console.log(`      - Display Order: ${b.display_order}`);
        console.log(`      - Is Active: ${b.is_active}`);
        console.log(`      - Total Questions: ${b.total_questions}`);
      });
    } else {
      console.log('❌ Vazio ou inválido:', JSON.stringify(ranking.exam_booklets));
    }
    
    console.log('\n📋 METADATA:');
    if (ranking.metadata && typeof ranking.metadata === 'object') {
      console.log('✅ Tem dados:', Object.keys(ranking.metadata).length, 'campos');
      console.log('   - Campos:', Object.keys(ranking.metadata));
    } else {
      console.log('❌ Vazio ou inválido:', JSON.stringify(ranking.metadata));
    }
    
    // 2. Comparar com dados das tabelas antigas
    console.log('\n2. Comparando com dados das tabelas antigas...');
    
    // exam_booklets
    const { data: bookletsTable } = await supabase
      .from('exam_booklets')
      .select('*')
      .eq('concurso_id', rankingId);
    
    console.log('\n📊 COMPARAÇÃO EXAM_BOOKLETS:');
    console.log('   JSONB:', ranking.exam_booklets?.length || 0, 'cadernos');
    console.log('   Tabela:', bookletsTable?.length || 0, 'cadernos');
    
    if (ranking.exam_booklets?.length > 0 && bookletsTable?.length > 0) {
      console.log('   ⚠️ DADOS DUPLICADOS: Existe em ambos os lugares!');
      console.log('   - JSONB:', ranking.exam_booklets.map((b: any) => b.name));
      console.log('   - Tabela:', bookletsTable.map((b: any) => b.name));
    } else if (ranking.exam_booklets?.length > 0) {
      console.log('   ✅ Dados apenas no JSONB (correto)');
    } else if (bookletsTable?.length > 0) {
      console.log('   ❌ Dados apenas na tabela (incorreto)');
    } else {
      console.log('   ❌ Sem dados em lugar nenhum');
    }
    
    // official_answer_weights
    const { data: weightsTable } = await supabase
      .from('official_answer_weights')
      .select('*')
      .eq('concurso_id', rankingId);
    
    console.log('\n📊 COMPARAÇÃO OFFICIAL_ANSWERS:');
    console.log('   JSONB:', ranking.official_answers ? 'Tem dados' : 'Vazio');
    console.log('   Tabela:', weightsTable?.length || 0, 'registros');
    
    if (ranking.official_answers && weightsTable?.length > 0) {
      console.log('   ⚠️ DADOS DUPLICADOS: Existe em ambos os lugares!');
    } else if (ranking.official_answers) {
      console.log('   ✅ Dados apenas no JSONB (correto)');
    } else if (weightsTable?.length > 0) {
      console.log('   ❌ Dados apenas na tabela (incorreto)');
    } else {
      console.log('   ❌ Sem dados em lugar nenhum');
    }
    
    // 3. Diagnóstico final
    console.log('\n🎯 DIAGNÓSTICO FINAL:');
    console.log('=' .repeat(50));
    
    const hasJsonbData = ranking.exam_booklets?.length > 0 || 
                        ranking.official_answers || 
                        ranking.disciplines?.length > 0;
    
    const hasTableData = bookletsTable?.length > 0 || weightsTable?.length > 0;
    
    if (hasJsonbData && hasTableData) {
      console.log('⚠️ SISTEMA HÍBRIDO: Dados existem em ambos os lugares');
      console.log('   - Frontend pode estar lendo da tabela antiga');
      console.log('   - Precisa migrar completamente para JSONB');
      console.log('   - Precisa remover dependências das tabelas antigas');
    } else if (hasJsonbData) {
      console.log('✅ SISTEMA CORRETO: Dados apenas no JSONB');
      console.log('   - Frontend deve estar lendo do JSONB');
      console.log('   - Problema pode ser no frontend não carregando corretamente');
    } else if (hasTableData) {
      console.log('❌ SISTEMA INCORRETO: Dados apenas nas tabelas antigas');
      console.log('   - Frontend está lendo das tabelas antigas');
      console.log('   - Precisa migrar dados para JSONB');
      console.log('   - Precisa corrigir frontend para usar JSONB');
    } else {
      console.log('❌ SEM DADOS: Nenhum dado encontrado');
      console.log('   - Ranking não foi configurado corretamente');
      console.log('   - Precisa criar dados do zero');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

checkJsonbContent();



