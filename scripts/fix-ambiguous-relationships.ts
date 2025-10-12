import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixAmbiguousRelationships() {
  console.log('🔧 Corrigindo relacionamentos ambíguos...');

  try {
    // 1. Testar queries com relacionamentos explícitos
    console.log('\n🔍 TESTANDO QUERIES COM RELACIONAMENTOS EXPLÍCITOS:');
    console.log('=' .repeat(60));

    // Teste 1: Ranking com participações (usando foreign key explícita)
    console.log('\n1. Testando ranking com participações (FK explícita)...');
    const { data: rankingWithParticipations, error: rankingWithParticipationsError } = await supabase
      .from('rankings')
      .select(`
        id,
        titulo,
        orgao,
        banca,
        status,
        user_rankings!ranking_id (
          id,
          user_id,
          score,
          position
        )
      `)
      .limit(1);

    if (rankingWithParticipationsError) {
      console.log('❌ Erro no join ranking-participações (FK explícita):', rankingWithParticipationsError.message);
    } else {
      console.log('✅ Join ranking-participações (FK explícita) OK');
    }

    // Teste 2: Ranking com disciplinas (usando foreign key explícita)
    console.log('\n2. Testando ranking com disciplinas (FK explícita)...');
    const { data: rankingWithDisciplines, error: rankingWithDisciplinesError } = await supabase
      .from('rankings')
      .select(`
        id,
        titulo,
        orgao,
        banca,
        status,
        ranking_disciplines!ranking_id (
          id,
          discipline_name,
          weight,
          total_questions
        )
      `)
      .limit(1);

    if (rankingWithDisciplinesError) {
      console.log('❌ Erro no join ranking-disciplinas (FK explícita):', rankingWithDisciplinesError.message);
    } else {
      console.log('✅ Join ranking-disciplinas (FK explícita) OK');
    }

    // Teste 3: Participações com ranking (query reversa)
    console.log('\n3. Testando participações com ranking (query reversa)...');
    const { data: participationsWithRanking, error: participationsWithRankingError } = await supabase
      .from('user_rankings')
      .select(`
        id,
        user_id,
        score,
        position,
        rankings!ranking_id (
          id,
          titulo,
          orgao,
          banca,
          status
        )
      `)
      .limit(1);

    if (participationsWithRankingError) {
      console.log('❌ Erro no join participações-ranking:', participationsWithRankingError.message);
    } else {
      console.log('✅ Join participações-ranking OK');
    }

    // Teste 4: Disciplinas com ranking (query reversa)
    console.log('\n4. Testando disciplinas com ranking (query reversa)...');
    const { data: disciplinesWithRanking, error: disciplinesWithRankingError } = await supabase
      .from('ranking_disciplines')
      .select(`
        id,
        discipline_name,
        weight,
        total_questions,
        rankings!ranking_id (
          id,
          titulo,
          orgao,
          banca,
          status
        )
      `)
      .limit(1);

    if (disciplinesWithRankingError) {
      console.log('❌ Erro no join disciplinas-ranking:', disciplinesWithRankingError.message);
    } else {
      console.log('✅ Join disciplinas-ranking OK');
    }

    // 2. Testar queries com joins manuais
    console.log('\n🔗 TESTANDO QUERIES COM JOINS MANUAIS:');
    console.log('=' .repeat(60));

    // Teste 5: Buscar rankings e depois suas participações
    console.log('\n5. Testando busca manual de rankings e participações...');
    const { data: rankings, error: rankingsError } = await supabase
      .from('rankings')
      .select('id, titulo, orgao, banca, status')
      .limit(1);

    if (rankingsError) {
      console.log('❌ Erro ao buscar rankings:', rankingsError.message);
    } else if (rankings && rankings.length > 0) {
      const rankingId = rankings[0].id;
      
      const { data: participations, error: participationsError } = await supabase
        .from('user_rankings')
        .select('id, user_id, score, position')
        .eq('ranking_id', rankingId);

      if (participationsError) {
        console.log('❌ Erro ao buscar participações:', participationsError.message);
      } else {
        console.log('✅ Busca manual OK:', participations?.length || 0, 'participações');
      }
    }

    // 3. Gerar SQL para corrigir relacionamentos
    console.log('\n🔧 GERANDO SQL PARA CORRIGIR RELACIONAMENTOS:');
    console.log('=' .repeat(60));

    const fixRelationshipsSQL = `
-- =====================================================
-- CORRIGIR RELACIONAMENTOS AMBÍGUOS
-- BANCO: nomeia-ai
-- DATA: ${new Date().toISOString()}
-- =====================================================

-- 1. VERIFICAR CONSTRAINTS EXISTENTES
-- =====================================================

-- Verificar constraints de foreign key
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('user_rankings', 'ranking_disciplines', 'user_answers', 'ranking_answers')
  AND ccu.table_name = 'rankings';

-- 2. REMOVER CONSTRAINTS DUPLICADOS (SE HOUVER)
-- =====================================================

-- Remover constraints duplicados de user_rankings
ALTER TABLE user_rankings DROP CONSTRAINT IF EXISTS user_rankings_ranking_id_fkey;
ALTER TABLE user_rankings DROP CONSTRAINT IF EXISTS fk_user_rankings_ranking;

-- Remover constraints duplicados de ranking_disciplines
ALTER TABLE ranking_disciplines DROP CONSTRAINT IF EXISTS ranking_disciplines_ranking_id_fkey;
ALTER TABLE ranking_disciplines DROP CONSTRAINT IF EXISTS fk_ranking_disciplines_ranking;

-- Remover constraints duplicados de user_answers
ALTER TABLE user_answers DROP CONSTRAINT IF EXISTS user_answers_ranking_id_fkey;
ALTER TABLE user_answers DROP CONSTRAINT IF EXISTS fk_user_answers_ranking;

-- Remover constraints duplicados de ranking_answers
ALTER TABLE ranking_answers DROP CONSTRAINT IF EXISTS ranking_answers_ranking_id_fkey;
ALTER TABLE ranking_answers DROP CONSTRAINT IF EXISTS fk_ranking_answers_ranking;

-- 3. CRIAR CONSTRAINTS ÚNICOS E CLAROS
-- =====================================================

-- Constraint para user_rankings
ALTER TABLE user_rankings 
ADD CONSTRAINT fk_user_rankings_ranking_id 
FOREIGN KEY (ranking_id) REFERENCES rankings(id) ON DELETE CASCADE;

-- Constraint para ranking_disciplines
ALTER TABLE ranking_disciplines 
ADD CONSTRAINT fk_ranking_disciplines_ranking_id 
FOREIGN KEY (ranking_id) REFERENCES rankings(id) ON DELETE CASCADE;

-- Constraint para user_answers
ALTER TABLE user_answers 
ADD CONSTRAINT fk_user_answers_ranking_id 
FOREIGN KEY (ranking_id) REFERENCES rankings(id) ON DELETE CASCADE;

-- Constraint para ranking_answers
ALTER TABLE ranking_answers 
ADD CONSTRAINT fk_ranking_answers_ranking_id 
FOREIGN KEY (ranking_id) REFERENCES rankings(id) ON DELETE CASCADE;

-- 4. VERIFICAR RELACIONAMENTOS CORRIGIDOS
-- =====================================================

-- Testar relacionamentos
SELECT 'user_rankings' as table_name, count(*) as records FROM user_rankings
UNION ALL
SELECT 'ranking_disciplines' as table_name, count(*) as records FROM ranking_disciplines
UNION ALL
SELECT 'user_answers' as table_name, count(*) as records FROM user_answers
UNION ALL
SELECT 'ranking_answers' as table_name, count(*) as records FROM ranking_answers;
`;

    console.log('\n📝 SQL para corrigir relacionamentos:');
    console.log(fixRelationshipsSQL);

    console.log('\n⚠️  ATENÇÃO: Este SQL deve ser executado manualmente no Supabase SQL Editor!');
    console.log('🔗 Acesse: https://supabase.com/dashboard/project/xuovcuefnullpmpktrzd/sql');
    console.log('📋 Copie e cole o SQL acima no editor');

    // 4. Resumo dos problemas e soluções
    console.log('\n📊 RESUMO DOS PROBLEMAS E SOLUÇÕES:');
    console.log('=' .repeat(60));
    console.log('❌ Problema: Relacionamentos ambíguos entre tabelas');
    console.log('🔧 Solução: Remover constraints duplicados e criar constraints únicos');
    console.log('✅ Resultado: Queries com joins funcionarão corretamente');

  } catch (error) {
    console.error('❌ Erro na correção:', error);
  }
}

fixAmbiguousRelationships();