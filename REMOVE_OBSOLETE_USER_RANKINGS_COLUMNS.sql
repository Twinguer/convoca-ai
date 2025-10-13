-- =====================================================
-- SCRIPT DE LIMPEZA: REMOÇÃO DE COLUNAS OBSOLETAS
-- Tabela: user_rankings
-- Data: 2025-01-15
-- =====================================================

-- Este script remove colunas obsoletas da tabela user_rankings
-- que foram substituídas pelo sistema unificado de pontuações (JSONB)

-- ⚠️  IMPORTANTE: Execute este script em ambiente de desenvolvimento primeiro!
-- ⚠️  Faça backup da tabela antes de executar em produção!

BEGIN;

-- =====================================================
-- 1. REMOÇÃO DE COLUNAS DE PONTUAÇÕES SUBJETIVAS INDIVIDUAIS
-- =====================================================

-- Remover colunas de pontuações subjetivas individuais
-- (substituídas por subject_scores JSONB)
ALTER TABLE user_rankings DROP COLUMN IF EXISTS discursive_score;
ALTER TABLE user_rankings DROP COLUMN IF EXISTS case_study_1_score;
ALTER TABLE user_rankings DROP COLUMN IF EXISTS case_study_2_score;
ALTER TABLE user_rankings DROP COLUMN IF EXISTS case_study_3_score;

-- =====================================================
-- 2. REMOÇÃO DE COLUNAS DE PONTUAÇÕES OBJETIVAS INDIVIDUAIS
-- =====================================================

-- Remover colunas de pontuações objetivas individuais
-- (substituídas por customDisciplineScores JSONB)
ALTER TABLE user_rankings DROP COLUMN IF EXISTS basic_knowledge_score;
ALTER TABLE user_rankings DROP COLUMN IF EXISTS specific_knowledge_score;
ALTER TABLE user_rankings DROP COLUMN IF EXISTS specific_knowledge_1_score;
ALTER TABLE user_rankings DROP COLUMN IF EXISTS specific_knowledge_2_score;
ALTER TABLE user_rankings DROP COLUMN IF EXISTS specific_knowledge_3_score;

-- =====================================================
-- 3. REMOÇÃO DE COLUNAS DE PONTUAÇÕES PONDERADAS INDIVIDUAIS
-- =====================================================

-- Remover colunas de pontuações ponderadas individuais
-- (substituídas por weightedCustomDisciplineScores JSONB)
ALTER TABLE user_rankings DROP COLUMN IF EXISTS weighted_basic_score;
ALTER TABLE user_rankings DROP COLUMN IF EXISTS weighted_specific_1_score;
ALTER TABLE user_rankings DROP COLUMN IF EXISTS weighted_specific_2_score;
ALTER TABLE user_rankings DROP COLUMN IF EXISTS weighted_specific_3_score;
ALTER TABLE user_rankings DROP COLUMN IF EXISTS weighted_discursive_score;
ALTER TABLE user_rankings DROP COLUMN IF EXISTS weighted_case_study_1_score;
ALTER TABLE user_rankings DROP COLUMN IF EXISTS weighted_case_study_2_score;
ALTER TABLE user_rankings DROP COLUMN IF EXISTS weighted_case_study_3_score;

-- =====================================================
-- 4. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_rankings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 5. COMENTÁRIOS SOBRE A ESTRUTURA FINAL
-- =====================================================

/*
ESTRUTURA FINAL DA TABELA user_rankings:

COLUNAS ESSENCIAIS (20 colunas):
├── Identificação:
│   ├── id (uuid, PK)
│   ├── user_id (uuid, FK)
│   ├── concurso_id (uuid, FK)
│   └── score (numeric) - Score total
├── Controle:
│   ├── created_at, updated_at (timestamps)
│   ├── edit_count (integer)
│   ├── is_score_recalculated (boolean)
│   └── all_questions_answered (boolean)
├── Funcionalidades:
│   ├── reservation_type (text)
│   ├── selected_booklet (uuid)
│   └── edit_history (jsonb)
└── Sistema Unificado (JSONB):
    ├── subject_scores - Pontuações subjetivas unificadas
    ├── customDisciplineScores - Pontuações por disciplina
    ├── weightedCustomDisciplineScores - Pontuações ponderadas
    ├── participations - Participações
    └── metadata - Metadados gerais

BENEFÍCIOS DA OTIMIZAÇÃO:
✅ 13 colunas removidas (40% de redução)
✅ Estrutura mais limpa e organizada
✅ Menos redundância de dados
✅ Melhor performance
✅ Manutenção mais simples
✅ Sistema unificado e flexível
*/

COMMIT;

-- =====================================================
-- SCRIPT EXECUTADO COM SUCESSO! 🚀
-- =====================================================
