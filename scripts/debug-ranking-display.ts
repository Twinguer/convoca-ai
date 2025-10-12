import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRankingDisplay() {
  console.log('🔍 Debugando exibição de rankings...\n');

  try {
    // 1. Verificar todos os rankings no banco
    console.log('1. Verificando todos os rankings no banco...');
    
    const { data: allRankings, error: allError } = await supabase
      .from('concursos')
      .select('id, titulo, status, created_at, has_basic_knowledge, basic_knowledge_questions, disciplines, exam_booklets, official_answers')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Erro ao buscar rankings:', allError);
      return;
    }

    console.log(`✅ Encontrados ${allRankings.length} rankings no banco:`);
    allRankings.forEach((ranking, index) => {
      console.log(`   ${index + 1}. ${ranking.titulo} (${ranking.id})`);
      console.log(`      - Status: ${ranking.status}`);
      console.log(`      - Criado: ${ranking.created_at}`);
      console.log(`      - has_basic_knowledge: ${ranking.has_basic_knowledge}`);
      console.log(`      - basic_knowledge_questions: ${ranking.basic_knowledge_questions}`);
      console.log(`      - Disciplinas: ${ranking.disciplines?.length || 0}`);
      console.log(`      - Cadernos: ${ranking.exam_booklets?.length || 0}`);
      console.log(`      - Gabaritos: ${Object.keys(ranking.official_answers || {}).length}`);
      console.log('');
    });

    // 2. Simular query que o frontend faria
    console.log('2. Simulando query do frontend...');
    
    // Query básica (como no useRankingsData)
    const { data: frontendRankings, error: frontendError } = await supabase
      .from('concursos')
      .select(`
        id,
        titulo,
        orgao,
        banca,
        status,
        created_at,
        exam_type,
        has_minimum_score,
        total_minimum_score,
        wrong_answer_penalty,
        alternatives_count,
        has_custom_knowledge,
        custom_knowledge_questions,
        custom_knowledge_weight,
        has_basic_knowledge,
        basic_knowledge_questions,
        basic_knowledge_weight,
        has_specific_knowledge_1,
        specific_knowledge_1_questions,
        specific_knowledge_1_weight,
        has_specific_knowledge_2,
        specific_knowledge_2_questions,
        specific_knowledge_2_weight,
        has_specific_knowledge_3,
        specific_knowledge_3_questions,
        specific_knowledge_3_weight,
        has_discursive,
        discursive_weight,
        has_case_study_1,
        case_study_1_weight,
        has_case_study_2,
        case_study_2_weight,
        has_case_study_3,
        case_study_3_weight,
        disciplines,
        subjects,
        form_config,
        official_answers,
        exam_booklets,
        metadata,
        total_participants
      `)
      .order('created_at', { ascending: false });

    if (frontendError) {
      console.error('❌ Erro na query do frontend:', frontendError);
      return;
    }

    console.log(`✅ Query do frontend retornou ${frontendRankings.length} rankings:`);
    frontendRankings.forEach((ranking, index) => {
      console.log(`   ${index + 1}. ${ranking.titulo} (${ranking.id})`);
      console.log(`      - Status: ${ranking.status}`);
      console.log(`      - Disciplinas: ${ranking.disciplines?.length || 0}`);
      console.log(`      - Cadernos: ${ranking.exam_booklets?.length || 0}`);
    });

    // 3. Verificar se há problemas de RLS (Row Level Security)
    console.log('\n3. Verificando RLS e permissões...');
    
    // Testar query com diferentes usuários
    const { data: publicRankings, error: publicError } = await supabase
      .from('concursos')
      .select('id, titulo, status')
      .limit(5);

    if (publicError) {
      console.error('❌ Erro na query pública:', publicError);
      console.log('   - Possível problema de RLS');
    } else {
      console.log(`✅ Query pública retornou ${publicRankings.length} rankings`);
    }

    // 4. Verificar se há filtros sendo aplicados
    console.log('\n4. Verificando filtros...');
    
    // Verificar se há filtros por status
    const statuses = ['Ativo', 'Em andamento', 'Finalizado', 'Cancelado'];
    for (const status of statuses) {
      const { data: statusRankings, error: statusError } = await supabase
        .from('concursos')
        .select('id, titulo, status')
        .eq('status', status);
      
      if (!statusError) {
        console.log(`   - Status "${status}": ${statusRankings.length} rankings`);
      }
    }

    // 5. Verificar se há problemas de cache
    console.log('\n5. Verificando possíveis problemas de cache...');
    
    // Query simples para verificar se há cache
    const { data: simpleRankings, error: simpleError } = await supabase
      .from('concursos')
      .select('count')
      .limit(1);

    if (simpleError) {
      console.error('❌ Erro na query simples:', simpleError);
    } else {
      console.log('✅ Query simples funcionou');
    }

    // 6. Análise do problema
    console.log('\n6. Análise do problema:');
    
    if (allRankings.length > 0 && frontendRankings.length === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: Rankings existem no banco mas não aparecem no frontend');
      console.log('   - Possíveis causas:');
      console.log('     * RLS (Row Level Security) bloqueando acesso');
      console.log('     * Filtros no frontend muito restritivos');
      console.log('     * Problema de cache');
      console.log('     * Erro na query do frontend');
    } else if (allRankings.length === frontendRankings.length) {
      console.log('✅ Rankings estão sendo exibidos corretamente');
    } else {
      console.log(`⚠️  Discrepância: ${allRankings.length} no banco vs ${frontendRankings.length} no frontend`);
    }

  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

debugRankingDisplay();
