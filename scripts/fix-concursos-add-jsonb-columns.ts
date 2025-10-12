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

async function fixConcursosAddJsonbColumns() {
  console.log('🔧 ADICIONANDO COLUNAS JSONB À TABELA CONCURSOS');
  console.log('=' .repeat(60));

  try {
    // SQL simples - apenas adicionar colunas JSONB que estão faltando
    const fixSQL = `
-- ADICIONAR COLUNAS JSONB À TABELA CONCURSOS
-- ==========================================

-- 1. Adicionar colunas JSONB se não existirem
ALTER TABLE public.concursos 
ADD COLUMN IF NOT EXISTS disciplines JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS subjects JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS form_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS official_answers JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS exam_booklets JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS total_participants INTEGER DEFAULT 0;

-- 2. Criar índices GIN para performance dos campos JSONB
CREATE INDEX IF NOT EXISTS idx_concursos_disciplines ON public.concursos USING GIN (disciplines);
CREATE INDEX IF NOT EXISTS idx_concursos_subjects ON public.concursos USING GIN (subjects);
CREATE INDEX IF NOT EXISTS idx_concursos_form_config ON public.concursos USING GIN (form_config);
CREATE INDEX IF NOT EXISTS idx_concursos_official_answers ON public.concursos USING GIN (official_answers);
CREATE INDEX IF NOT EXISTS idx_concursos_exam_booklets ON public.concursos USING GIN (exam_booklets);
CREATE INDEX IF NOT EXISTS idx_concursos_metadata ON public.concursos USING GIN (metadata);

-- 3. Verificar se as colunas foram adicionadas
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'concursos' 
    AND table_schema = 'public'
    AND column_name IN ('disciplines', 'subjects', 'form_config', 'official_answers', 'exam_booklets', 'metadata', 'total_participants')
ORDER BY column_name;
`;

    console.log('📝 SQL para adicionar colunas JSONB:');
    console.log(fixSQL);
    
    console.log('\n🔧 Execute este SQL no Supabase SQL Editor!');
    console.log('📋 Copie e cole o SQL acima no Supabase SQL Editor e execute.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixConcursosAddJsonbColumns();

