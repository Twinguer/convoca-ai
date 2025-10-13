import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyAllTableReferenceFixes() {
  console.log('🔧 Aplicando todas as correções de referências de tabelas...');

  try {
    // 1. Executar SQL das VIEWs de compatibilidade
    console.log('\n📝 EXECUTANDO SQL DAS VIEWs DE COMPATIBILIDADE:');
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

    console.log('\n⚠️  ATENÇÃO: Execute este SQL no Supabase SQL Editor:');
    console.log('🔗 Acesse: https://supabase.com/dashboard/project/xuovcuefnullpmpktrzd/sql');
    console.log('\n📋 SQL para copiar:');
    console.log(compatibilityViewsSQL);

    // 2. Testar se as VIEWs funcionam
    console.log('\n🧪 TESTANDO VIEWs DE COMPATIBILIDADE:');
    console.log('=' .repeat(60));

    // Testar public_profiles
    try {
      const { data: publicProfilesData, error: publicProfilesError } = await supabase
        .from('public_profiles')
        .select('id, name, avatar_url')
        .limit(1);

      if (publicProfilesError) {
        console.log('❌ public_profiles VIEW não existe ainda:', publicProfilesError.message);
        console.log('   Execute o SQL acima primeiro');
      } else {
        console.log('✅ public_profiles VIEW funcionando');
      }
    } catch (err) {
      console.log('❌ public_profiles VIEW não existe ainda');
      console.log('   Execute o SQL acima primeiro');
    }

    // Testar concursos
    try {
      const { data: concursosData, error: concursosError } = await supabase
        .from('concursos')
        .select('id, titulo, orgao')
        .limit(1);

      if (concursosError) {
        console.log('❌ concursos VIEW não existe ainda:', concursosError.message);
        console.log('   Execute o SQL acima primeiro');
      } else {
        console.log('✅ concursos VIEW funcionando');
      }
    } catch (err) {
      console.log('❌ concursos VIEW não existe ainda');
      console.log('   Execute o SQL acima primeiro');
    }

    // 3. Resumo das correções aplicadas
    console.log('\n📊 RESUMO DAS CORREÇÕES APLICADAS:');
    console.log('=' .repeat(60));
    console.log('✅ PublicUserProfile.tsx:');
    console.log('   - public_profiles → users_profiles');
    console.log('   - concurso_id → ranking_id');
    console.log('   - concursos(titulo, id) → rankings(titulo, id)');
    console.log('   - concursos table → rankings table');
    console.log('   - concursoData → rankingData');

    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('=' .repeat(60));
    console.log('1. Execute o SQL das VIEWs no Supabase SQL Editor');
    console.log('2. Teste o carregamento de perfis no frontend');
    console.log('3. Verifique se todos os erros 404 foram resolvidos');
    console.log('4. Teste todas as funcionalidades relacionadas a perfis');

    console.log('\n🎯 RESULTADO ESPERADO:');
    console.log('=' .repeat(60));
    console.log('✅ Perfis de usuários carregam corretamente');
    console.log('✅ Rankings são exibidos nos perfis');
    console.log('✅ Sem erros 404 ou 400');
    console.log('✅ Sistema funcionando com estrutura normalizada');

  } catch (error) {
    console.error('❌ Erro na aplicação das correções:', error);
  }
}

applyAllTableReferenceFixes();



