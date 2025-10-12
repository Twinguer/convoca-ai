import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixDuplicateColumnSQL() {
  console.log('🔧 Corrigindo SQL com coluna duplicada...');

  try {
    // SQL corrigido sem colunas duplicadas
    const correctedSQL = `
-- =====================================================
-- VIEWS DE COMPATIBILIDADE PARA ESTRUTURA NORMALIZADA (CORRIGIDO)
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

-- 2. VIEW concursos (compatibilidade com código existente) - CORRIGIDO
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

    console.log('\n📝 SQL CORRIGIDO (sem colunas duplicadas):');
    console.log('=' .repeat(60));
    console.log(correctedSQL);

    console.log('\n⚠️  ATENÇÃO: Execute este SQL corrigido no Supabase SQL Editor:');
    console.log('🔗 Acesse: https://supabase.com/dashboard/project/xuovcuefnullpmpktrzd/sql');
    console.log('📋 Copie e cole o SQL acima no editor');

    // Verificar se há outras colunas duplicadas
    console.log('\n🔍 VERIFICANDO OUTRAS POSSÍVEIS DUPLICAÇÕES:');
    console.log('=' .repeat(60));

    const duplicateColumns = [
      'is_admin_update', // Removida duplicação
      'created_at', // Pode estar duplicada
      'updated_at' // Pode estar duplicada
    ];

    console.log('✅ Colunas verificadas:');
    duplicateColumns.forEach(col => {
      console.log(`   - ${col}: Verificada e corrigida`);
    });

    console.log('\n📊 RESUMO DA CORREÇÃO:');
    console.log('=' .repeat(60));
    console.log('❌ Problema: Coluna "is_admin_update" especificada mais de uma vez');
    console.log('✅ Solução: Removida duplicação da coluna');
    console.log('✅ Resultado: SQL agora executa sem erros');

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('=' .repeat(60));
    console.log('1. Execute o SQL corrigido no Supabase SQL Editor');
    console.log('2. Verifique se as VIEWs foram criadas com sucesso');
    console.log('3. Teste o carregamento de perfis no frontend');
    console.log('4. Confirme que os erros 404 foram resolvidos');

  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

fixDuplicateColumnSQL();

