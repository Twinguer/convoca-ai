import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanupUnnecessaryTables() {
  console.log('🧹 Removendo tabelas desnecessárias do banco nomeia-ai...');

  try {
    // 1. Verificar tabelas que existem antes da limpeza
    console.log('\n📋 Verificando tabelas antes da limpeza...');
    
    const tablesToCheck = [
      'user_rankings_partitioned',
      'user_answers_partitioned',
      'performance_metrics'
    ];

    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${data?.length || 0} registros encontrados`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Tabela não existe`);
      }
    }

    // 2. Gerar SQL para remoção das tabelas desnecessárias
    console.log('\n🔧 Gerando SQL para limpeza...');
    
    const cleanupSQL = `
-- =====================================================
-- LIMPEZA DE TABELAS DESNECESSÁRIAS
-- BANCO: nomeia-ai
-- DATA: ${new Date().toISOString()}
-- =====================================================

-- 1. REMOVER TABELAS PARTICIONADAS DESNECESSÁRIAS
-- =====================================================

-- Remover tabelas particionadas (não eram necessárias para 5.000 usuários)
DROP TABLE IF EXISTS user_rankings_partitioned CASCADE;
DROP TABLE IF EXISTS user_answers_partitioned CASCADE;

-- 2. AVALIAR TABELA DE MÉTRICAS
-- =====================================================

-- Verificar se performance_metrics é necessária
-- Se não for necessária, descomente a linha abaixo:
-- DROP TABLE IF EXISTS performance_metrics CASCADE;

-- 3. VERIFICAR ESTRUTURA FINAL
-- =====================================================

-- Verificar se apenas as 6 tabelas planejadas existem
-- rankings, user_rankings, user_answers, ranking_answers, ranking_disciplines, users_profiles

-- 4. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE rankings IS 'Tabela principal de rankings - estrutura normalizada';
COMMENT ON TABLE user_rankings IS 'Participações de usuários em rankings';
COMMENT ON TABLE user_answers IS 'Respostas individuais dos usuários';
COMMENT ON TABLE ranking_answers IS 'Gabarito oficial dos rankings';
COMMENT ON TABLE ranking_disciplines IS 'Disciplinas e pesos dos rankings';
COMMENT ON TABLE users_profiles IS 'Perfis públicos dos usuários';
`;

    console.log('\n📝 SQL para limpeza:');
    console.log(cleanupSQL);

    console.log('\n⚠️  ATENÇÃO: Este SQL deve ser executado manualmente no Supabase SQL Editor!');
    console.log('🔗 Acesse: https://supabase.com/dashboard/project/xuovcuefnullpmpktrzd/sql');
    console.log('📋 Copie e cole o SQL acima no editor');

    // 3. Verificar se há problemas no sistema atual
    console.log('\n🔍 Verificando problemas no sistema atual...');
    
    // Testar queries básicas
    const { data: rankingsData, error: rankingsError } = await supabase
      .from('rankings')
      .select('id, titulo, status')
      .limit(5);

    if (rankingsError) {
      console.log('❌ Erro ao acessar rankings:', rankingsError.message);
    } else {
      console.log('✅ Rankings acessíveis:', rankingsData?.length || 0, 'registros');
    }

    // Testar user_rankings
    const { data: userRankingsData, error: userRankingsError } = await supabase
      .from('user_rankings')
      .select('id, ranking_id, user_id, score')
      .limit(5);

    if (userRankingsError) {
      console.log('❌ Erro ao acessar user_rankings:', userRankingsError.message);
    } else {
      console.log('✅ User rankings acessíveis:', userRankingsData?.length || 0, 'registros');
    }

    // Testar user_answers
    const { data: userAnswersData, error: userAnswersError } = await supabase
      .from('user_answers')
      .select('id, ranking_id, user_id, question_number')
      .limit(5);

    if (userAnswersError) {
      console.log('❌ Erro ao acessar user_answers:', userAnswersError.message);
    } else {
      console.log('✅ User answers acessíveis:', userAnswersData?.length || 0, 'registros');
    }

    console.log('\n📊 RESUMO DA LIMPEZA:');
    console.log('=' .repeat(50));
    console.log('✅ Tabelas a serem removidas: 2 (particionadas)');
    console.log('⚠️  Tabela a ser avaliada: 1 (performance_metrics)');
    console.log('✅ Tabelas principais: 6 (mantidas)');
    console.log('\n🎯 Próximo passo: Executar SQL no Supabase SQL Editor');

  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
  }
}

cleanupUnnecessaryTables();

