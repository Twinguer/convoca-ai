import 'dotenv/config';

console.log('🚀 GERANDO SQL PARA FASE 4 - TABELA RANKING_CALCULATIONS');
console.log('=' .repeat(60));

const phase4SQL = `
-- =====================================================
-- FASE 4: CRIAR TABELA RANKING_CALCULATIONS
-- =====================================================

-- 1. Criar tabela ranking_calculations
CREATE TABLE IF NOT EXISTS ranking_calculations (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concurso_id UUID NOT NULL REFERENCES concursos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Controle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Dados Básicos da Participação
  selected_booklet TEXT NOT NULL,
  reservation_type TEXT DEFAULT 'Ampla Concorrência',
  
  -- Cálculos por Seção
  basic_knowledge_raw_score NUMERIC DEFAULT 0,
  basic_knowledge_weighted_score NUMERIC DEFAULT 0,
  basic_knowledge_accuracy NUMERIC DEFAULT 0,
  basic_knowledge_correct_answers INTEGER DEFAULT 0,
  basic_knowledge_total_questions INTEGER DEFAULT 0,
  
  specific_knowledge_1_raw_score NUMERIC DEFAULT 0,
  specific_knowledge_1_weighted_score NUMERIC DEFAULT 0,
  specific_knowledge_1_accuracy NUMERIC DEFAULT 0,
  specific_knowledge_1_correct_answers INTEGER DEFAULT 0,
  specific_knowledge_1_total_questions INTEGER DEFAULT 0,
  
  specific_knowledge_2_raw_score NUMERIC DEFAULT 0,
  specific_knowledge_2_weighted_score NUMERIC DEFAULT 0,
  specific_knowledge_2_accuracy NUMERIC DEFAULT 0,
  specific_knowledge_2_correct_answers INTEGER DEFAULT 0,
  specific_knowledge_2_total_questions INTEGER DEFAULT 0,
  
  specific_knowledge_3_raw_score NUMERIC DEFAULT 0,
  specific_knowledge_3_weighted_score NUMERIC DEFAULT 0,
  specific_knowledge_3_accuracy NUMERIC DEFAULT 0,
  specific_knowledge_3_correct_answers INTEGER DEFAULT 0,
  specific_knowledge_3_total_questions INTEGER DEFAULT 0,
  
  discursive_raw_score NUMERIC DEFAULT 0,
  discursive_weighted_score NUMERIC DEFAULT 0,
  discursive_accuracy NUMERIC DEFAULT 0,
  discursive_correct_answers INTEGER DEFAULT 0,
  discursive_total_questions INTEGER DEFAULT 0,
  
  case_study_1_raw_score NUMERIC DEFAULT 0,
  case_study_1_weighted_score NUMERIC DEFAULT 0,
  case_study_1_accuracy NUMERIC DEFAULT 0,
  case_study_1_correct_answers INTEGER DEFAULT 0,
  case_study_1_total_questions INTEGER DEFAULT 0,
  
  case_study_2_raw_score NUMERIC DEFAULT 0,
  case_study_2_weighted_score NUMERIC DEFAULT 0,
  case_study_2_accuracy NUMERIC DEFAULT 0,
  case_study_2_correct_answers INTEGER DEFAULT 0,
  case_study_2_total_questions INTEGER DEFAULT 0,
  
  case_study_3_raw_score NUMERIC DEFAULT 0,
  case_study_3_weighted_score NUMERIC DEFAULT 0,
  case_study_3_accuracy NUMERIC DEFAULT 0,
  case_study_3_correct_answers INTEGER DEFAULT 0,
  case_study_3_total_questions INTEGER DEFAULT 0,
  
  -- Cálculos Finais
  total_raw_score NUMERIC DEFAULT 0,
  total_weighted_score NUMERIC DEFAULT 0,
  total_accuracy NUMERIC DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  total_blank_questions INTEGER DEFAULT 0,
  
  -- Posicionamento
  position INTEGER DEFAULT 0,
  percentile NUMERIC DEFAULT 0,
  
  -- Verificações de Mínimo
  passed_global_minimum BOOLEAN DEFAULT false,
  passed_block_minimums BOOLEAN DEFAULT false,
  passed_discipline_minimums BOOLEAN DEFAULT false,
  
  -- Controle de Edição
  edit_count INTEGER DEFAULT 0,
  last_edit_at TIMESTAMP WITH TIME ZONE,
  is_final_submission BOOLEAN DEFAULT false,
  
  -- Metadados de Cálculo
  calculation_version TEXT DEFAULT '1.0',
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculation_details JSONB DEFAULT '{}',
  
  -- Constraints
  UNIQUE(concurso_id, user_id)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ranking_calculations_concurso_position ON ranking_calculations (concurso_id, position);
CREATE INDEX IF NOT EXISTS idx_ranking_calculations_concurso_score ON ranking_calculations (concurso_id, total_weighted_score DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_calculations_user_id ON ranking_calculations (user_id);
CREATE INDEX IF NOT EXISTS idx_ranking_calculations_selected_booklet ON ranking_calculations (concurso_id, selected_booklet);
CREATE INDEX IF NOT EXISTS idx_ranking_calculations_last_calculated ON ranking_calculations (last_calculated DESC);

-- 3. Criar índices GIN para JSONB
CREATE INDEX IF NOT EXISTS idx_ranking_calculations_calculation_details_gin ON ranking_calculations USING GIN (calculation_details);

-- 4. Habilitar RLS
ALTER TABLE ranking_calculations ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS
CREATE POLICY "Users can view their own calculations" ON ranking_calculations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calculations" ON ranking_calculations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calculations" ON ranking_calculations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calculations" ON ranking_calculations
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Verificar estrutura criada
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ranking_calculations' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
`;

console.log('\n📋 SQL PARA EXECUTAR NO SUPABASE SQL EDITOR:');
console.log('=' .repeat(60));
console.log(phase4SQL);
console.log('\n✅ Copie o SQL acima e execute no Supabase SQL Editor');
console.log('🔗 Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql');

