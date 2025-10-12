import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis do arquivo .env (nomeia-ai)
config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixConcursosTableCorrected() {
  console.log('🔧 CORREÇÃO DEFINITIVA DA TABELA CONCURSOS (CORRIGIDA)');
  console.log('=' .repeat(60));

  try {
    // SQL corrigido - sem DO $$ e BEGIN
    const fixSQL = `
-- CORREÇÃO DEFINITIVA DA TABELA CONCURSOS (CORRIGIDA)
-- ==================================================

-- 1. Dropar view concursos se existir
DROP VIEW IF EXISTS public.concursos CASCADE;

-- 2. Dropar tabela concursos se existir (para recriar limpa)
DROP TABLE IF EXISTS public.concursos CASCADE;

-- 3. Criar tabela concursos com estrutura completa
CREATE TABLE public.concursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    orgao TEXT NOT NULL,
    banca TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Ativo', 'Finalizado', 'Inativo')),
    exam_type TEXT DEFAULT 'Alternativas',
    has_minimum_score BOOLEAN DEFAULT false,
    total_minimum_score NUMERIC DEFAULT 0,
    wrong_answer_penalty NUMERIC DEFAULT 0.25,
    alternatives_count INTEGER DEFAULT 5,
    has_custom_knowledge BOOLEAN DEFAULT true,
    created_by_user_id UUID REFERENCES auth.users(id),
    disciplines JSONB DEFAULT '[]'::jsonb,
    subjects JSONB DEFAULT '[]'::jsonb,
    form_config JSONB DEFAULT '{}'::jsonb,
    official_answers JSONB DEFAULT '{}'::jsonb,
    exam_booklets JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    total_participants INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_publicacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Campos adicionais que existiam na tabela original
    link TEXT,
    inscritos INTEGER DEFAULT 0,
    vagas INTEGER,
    knowledgeareas JSONB,
    localidades JSONB,
    is_admin_created BOOLEAN DEFAULT false,
    predefined_job_title TEXT,
    custom_job_title TEXT,
    has_ampla_concorrencia BOOLEAN DEFAULT true,
    has_ppp BOOLEAN DEFAULT false,
    has_pcd BOOLEAN DEFAULT false,
    has_hipossuficientes BOOLEAN DEFAULT false,
    has_indigenas BOOLEAN DEFAULT false,
    has_transsexuais BOOLEAN DEFAULT false,
    is_admin_update BOOLEAN DEFAULT false,
    has_basic_knowledge BOOLEAN DEFAULT false,
    has_specific_knowledge_1 BOOLEAN DEFAULT false,
    has_specific_knowledge_2 BOOLEAN DEFAULT false,
    has_specific_knowledge_3 BOOLEAN DEFAULT false,
    has_discursive BOOLEAN DEFAULT false,
    has_case_study_1 BOOLEAN DEFAULT false,
    has_case_study_2 BOOLEAN DEFAULT false,
    has_case_study_3 BOOLEAN DEFAULT false,
    basic_knowledge_questions INTEGER DEFAULT 0,
    specific_knowledge_1_questions INTEGER DEFAULT 0,
    specific_knowledge_2_questions INTEGER DEFAULT 0,
    specific_knowledge_3_questions INTEGER DEFAULT 0,
    basic_knowledge_weight NUMERIC DEFAULT 0,
    specific_knowledge_1_weight NUMERIC DEFAULT 0,
    specific_knowledge_2_weight NUMERIC DEFAULT 0,
    specific_knowledge_3_weight NUMERIC DEFAULT 0,
    discursive_weight NUMERIC DEFAULT 0,
    case_study_1_weight NUMERIC DEFAULT 0,
    case_study_2_weight NUMERIC DEFAULT 0,
    case_study_3_weight NUMERIC DEFAULT 0,
    custom_knowledge_questions INTEGER DEFAULT 0,
    custom_knowledge_weight NUMERIC DEFAULT 0,
    minimum_score_type TEXT,
    minimum_score_unit_type TEXT,
    custom_banca TEXT,
    etapa_atual TEXT DEFAULT 'Ativo'
);

-- 4. Criar índices para performance
CREATE INDEX idx_concursos_status ON public.concursos(status);
CREATE INDEX idx_concursos_created_by ON public.concursos(created_by_user_id);
CREATE INDEX idx_concursos_created_at ON public.concursos(created_at);
CREATE INDEX idx_concursos_disciplines ON public.concursos USING GIN (disciplines);
CREATE INDEX idx_concursos_exam_type ON public.concursos(exam_type);

-- 5. Criar função para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar trigger para updated_at
CREATE TRIGGER update_concursos_updated_at 
    BEFORE UPDATE ON public.concursos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Habilitar RLS
ALTER TABLE public.concursos ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas RLS básicas
CREATE POLICY "Users can view all concursos" ON public.concursos
    FOR SELECT USING (true);

CREATE POLICY "Users can insert concursos" ON public.concursos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own concursos" ON public.concursos
    FOR UPDATE USING (auth.uid() = created_by_user_id OR created_by_user_id IS NULL);

-- 9. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'concursos' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
`;

    console.log('📝 SQL de correção corrigido:');
    console.log(fixSQL);
    
    console.log('\n🔧 Execute este SQL corrigido no Supabase SQL Editor!');
    console.log('📋 Copie e cole o SQL acima no Supabase SQL Editor e execute.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixConcursosTableCorrected();

