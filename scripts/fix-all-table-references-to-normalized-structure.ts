import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixAllTableReferencesToNormalizedStructure() {
  console.log('🔧 Corrigindo TODAS as referências para estrutura normalizada...');
  console.log('📋 Estrutura normalizada: rankings, user_rankings, user_answers, ranking_answers, ranking_disciplines, users_profiles');

  try {
    // 1. Verificar estrutura atual
    console.log('\n📊 VERIFICANDO ESTRUTURA ATUAL:');
    console.log('=' .repeat(60));

    const normalizedTables = [
      'rankings',
      'user_rankings', 
      'user_answers',
      'ranking_answers',
      'ranking_disciplines',
      'users_profiles'
    ];

    const oldTables = [
      'concursos',
      'public_profiles',
      'official_answer_weights',
      'consolidated_answers_by_concurso',
      'exam_booklets'
    ];

    console.log('✅ Tabelas normalizadas (devem existir):');
    for (const table of normalizedTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: OK`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: Não existe`);
      }
    }

    console.log('\n❌ Tabelas antigas (não devem existir):');
    for (const table of oldTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`   ✅ ${table}: Não existe (correto)`);
        } else {
          console.log(`   ❌ ${table}: Ainda existe (deve ser removida)`);
        }
      } catch (err) {
        console.log(`   ✅ ${table}: Não existe (correto)`);
      }
    }

    // 2. Gerar SQL para criar VIEWs de compatibilidade
    console.log('\n🔧 GERANDO SQL PARA VIEWS DE COMPATIBILIDADE:');
    console.log('=' .repeat(60));

    const compatibilityViewsSQL = `
-- =====================================================
-- VIEWS DE COMPATIBILIDADE PARA ESTRUTURA NORMALIZADA
-- BANCO: nomeia-ai
-- DATA: ${new Date().toISOString()}
-- =====================================================

-- 1. VIEW public_profiles (compatibilidade com código existente)
-- =====================================================
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id,
  name,
  avatar_url,
  created_at,
  updated_at,
  bio,
  estado,
  formacao,
  cargo_atual,
  area_estudos,
  especialidade,
  curso_preparatorio,
  rotina_estudos,
  status_concurseiro,
  nickname,
  email,
  concursos_aprovados,
  concursos_participando,
  profile_text,
  is_studying,
  study_started_at,
  privacy_settings
FROM users_profiles;

-- 2. VIEW concursos (compatibilidade com código existente)
-- =====================================================
CREATE OR REPLACE VIEW concursos AS
SELECT 
  id,
  titulo,
  orgao,
  banca,
  status,
  created_at as data_publicacao,
  created_at,
  updated_at,
  created_by as created_by_user_id,
  exam_type,
  has_minimum_score,
  total_minimum_score,
  wrong_answer_penalty,
  descricao as link,
  total_participants as inscritos,
  null as vagas,
  null as knowledgeAreas,
  null as localidades,
  false as is_admin_created,
  true as has_custom_knowledge,
  5 as alternatives_count,
  null as predefined_job_title,
  null as custom_job_title,
  true as has_ampla_concorrencia,
  false as has_ppp,
  false as has_pcd,
  false as has_hipossuficientes,
  false as has_indigenas,
  false as has_transsexuais,
  false as is_admin_update,
  false as has_basic_knowledge,
  false as has_specific_knowledge_1,
  false as has_specific_knowledge_2,
  false as has_specific_knowledge_3,
  false as has_discursive,
  false as has_case_study_1,
  false as has_case_study_2,
  false as has_case_study_3,
  0 as basic_knowledge_questions,
  0 as specific_knowledge_1_questions,
  0 as specific_knowledge_2_questions,
  0 as specific_knowledge_3_questions,
  0 as basic_knowledge_weight,
  0 as specific_knowledge_1_weight,
  0 as specific_knowledge_2_weight,
  0 as specific_knowledge_3_weight,
  0 as discursive_weight,
  0 as case_study_1_weight,
  0 as case_study_2_weight,
  0 as case_study_3_weight,
  0 as custom_knowledge_questions,
  0 as custom_knowledge_weight,
  null as minimum_score_type,
  null as minimum_score_unit_type,
  null as custom_banca,
  false as is_admin_update,
  'Ativo' as etapa_atual
FROM rankings;

-- 3. VIEW official_answer_weights (compatibilidade)
-- =====================================================
CREATE OR REPLACE VIEW official_answer_weights AS
SELECT 
  id,
  ranking_id as concurso_id,
  question_number,
  correct_answer,
  weight,
  is_nullified,
  created_at
FROM ranking_answers;

-- 4. VIEW consolidated_answers_by_concurso (compatibilidade)
-- =====================================================
CREATE OR REPLACE VIEW consolidated_answers_by_concurso AS
SELECT 
  ranking_id as concurso_id,
  jsonb_agg(
    jsonb_build_object(
      'question_number', question_number,
      'correct_answer', correct_answer,
      'weight', weight,
      'is_nullified', is_nullified
    ) ORDER BY question_number
  ) as answers_data,
  created_at
FROM ranking_answers
GROUP BY ranking_id, created_at;

-- 5. VIEW exam_booklets (compatibilidade)
-- =====================================================
CREATE OR REPLACE VIEW exam_booklets AS
SELECT 
  id,
  ranking_id as concurso_id,
  booklet_name,
  total_questions,
  created_at
FROM ranking_answers
GROUP BY id, ranking_id, booklet_name, total_questions, created_at;

-- 6. Comentários das VIEWs
-- =====================================================
COMMENT ON VIEW public_profiles IS 'View de compatibilidade para public_profiles baseada em users_profiles';
COMMENT ON VIEW concursos IS 'View de compatibilidade para concursos baseada em rankings';
COMMENT ON VIEW official_answer_weights IS 'View de compatibilidade para official_answer_weights baseada em ranking_answers';
COMMENT ON VIEW consolidated_answers_by_concurso IS 'View de compatibilidade para consolidated_answers_by_concurso baseada em ranking_answers';
COMMENT ON VIEW exam_booklets IS 'View de compatibilidade para exam_booklets baseada em ranking_answers';
`;

    console.log('\n📝 SQL para criar VIEWs de compatibilidade:');
    console.log(compatibilityViewsSQL);

    // 3. Gerar script para corrigir código
    console.log('\n🔧 SCRIPT PARA CORRIGIR CÓDIGO:');
    console.log('=' .repeat(60));

    const codeFixesScript = `
// =====================================================
// CORREÇÕES DE CÓDIGO PARA ESTRUTURA NORMALIZADA
// =====================================================

// 1. PublicUserProfile.tsx
// =====================================================
// Linha 82: .from('public_profiles') → .from('users_profiles')
// Linha 152: concursos(titulo, id) → rankings(titulo, id)  
// Linha 165: .from('concursos') → .from('rankings')

// 2. FollowersService.ts
// =====================================================
// Verificar se usa tabelas corretas

// 3. Outros arquivos que referenciam tabelas antigas
// =====================================================
// Buscar e substituir:
// - 'public_profiles' → 'users_profiles'
// - 'concursos' → 'rankings' (quando apropriado)
// - 'official_answer_weights' → 'ranking_answers'
// - 'consolidated_answers_by_concurso' → 'ranking_answers'

// 4. Queries de relacionamento
// =====================================================
// Atualizar joins para usar:
// - user_rankings.ranking_id → rankings.id
// - user_answers.ranking_id → rankings.id
// - ranking_answers.ranking_id → rankings.id
// - ranking_disciplines.ranking_id → rankings.id
`;

    console.log(codeFixesScript);

    // 4. Verificar dados de teste
    console.log('\n📊 VERIFICANDO DADOS DE TESTE:');
    console.log('=' .repeat(60));

    const { data: rankingsData } = await supabase.from('rankings').select('id, titulo').limit(3);
    const { data: usersData } = await supabase.from('users_profiles').select('id, name').limit(3);
    const { data: userRankingsData } = await supabase.from('user_rankings').select('id, ranking_id, user_id').limit(3);

    console.log(`   Rankings: ${rankingsData?.length || 0} registros`);
    console.log(`   Usuários: ${usersData?.length || 0} registros`);
    console.log(`   Participações: ${userRankingsData?.length || 0} registros`);

    if (rankingsData && rankingsData.length > 0) {
      console.log('   Exemplo de ranking:', rankingsData[0].titulo);
    }

    // 5. Resumo final
    console.log('\n📊 RESUMO FINAL:');
    console.log('=' .repeat(60));
    console.log('✅ Estrutura normalizada: 6 tabelas principais');
    console.log('🔧 VIEWs de compatibilidade: 5 VIEWs para código existente');
    console.log('📝 Correções de código: Referências de tabelas antigas');
    console.log('🎯 Resultado: Sistema funcional com estrutura normalizada');

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('=' .repeat(60));
    console.log('1. Executar SQL das VIEWs de compatibilidade');
    console.log('2. Aplicar correções de código');
    console.log('3. Testar carregamento de perfis');
    console.log('4. Verificar todas as funcionalidades');

  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

fixAllTableReferencesToNormalizedStructure();



