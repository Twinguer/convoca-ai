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

async function verifyAndFixJsonbColumns() {
  console.log('🔍 VERIFICANDO E CORRIGINDO COLUNAS JSONB');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar se as colunas existem
    console.log('1️⃣ Verificando se as colunas JSONB existem...');
    
    const { data: columnsData, error: columnsError } = await supabase
      .from('concursos')
      .select('*')
      .limit(1);
      
    if (columnsError) {
      console.log('❌ Erro ao verificar colunas:', columnsError);
    } else {
      console.log('📊 Colunas existentes:', Object.keys(columnsData[0] || {}));
    }
    
    // 2. Gerar SQL para verificar e adicionar colunas
    console.log('\n2️⃣ Gerando SQL para verificar e adicionar colunas...');
    
    const verifySQL = `
-- VERIFICAR E ADICIONAR COLUNAS JSONB
-- ===================================

-- 1. Verificar se as colunas existem
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

-- 2. Se as colunas não existirem, adicionar uma por vez
DO $$
BEGIN
    -- Adicionar disciplines se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'concursos' AND column_name = 'disciplines') THEN
        ALTER TABLE public.concursos ADD COLUMN disciplines JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Coluna disciplines adicionada';
    END IF;
    
    -- Adicionar subjects se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'concursos' AND column_name = 'subjects') THEN
        ALTER TABLE public.concursos ADD COLUMN subjects JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Coluna subjects adicionada';
    END IF;
    
    -- Adicionar form_config se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'concursos' AND column_name = 'form_config') THEN
        ALTER TABLE public.concursos ADD COLUMN form_config JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Coluna form_config adicionada';
    END IF;
    
    -- Adicionar official_answers se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'concursos' AND column_name = 'official_answers') THEN
        ALTER TABLE public.concursos ADD COLUMN official_answers JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Coluna official_answers adicionada';
    END IF;
    
    -- Adicionar exam_booklets se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'concursos' AND column_name = 'exam_booklets') THEN
        ALTER TABLE public.concursos ADD COLUMN exam_booklets JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Coluna exam_booklets adicionada';
    END IF;
    
    -- Adicionar metadata se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'concursos' AND column_name = 'metadata') THEN
        ALTER TABLE public.concursos ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Coluna metadata adicionada';
    END IF;
    
    -- Adicionar total_participants se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'concursos' AND column_name = 'total_participants') THEN
        ALTER TABLE public.concursos ADD COLUMN total_participants INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna total_participants adicionada';
    END IF;
END $$;

-- 3. Verificar novamente após adicionar
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

-- 4. Criar índices GIN para performance
CREATE INDEX IF NOT EXISTS idx_concursos_disciplines ON public.concursos USING GIN (disciplines);
CREATE INDEX IF NOT EXISTS idx_concursos_subjects ON public.concursos USING GIN (subjects);
CREATE INDEX IF NOT EXISTS idx_concursos_form_config ON public.concursos USING GIN (form_config);
CREATE INDEX IF NOT EXISTS idx_concursos_official_answers ON public.concursos USING GIN (official_answers);
CREATE INDEX IF NOT EXISTS idx_concursos_exam_booklets ON public.concursos USING GIN (exam_booklets);
CREATE INDEX IF NOT EXISTS idx_concursos_metadata ON public.concursos USING GIN (metadata);
`;

    console.log('📝 SQL para verificar e adicionar colunas:');
    console.log(verifySQL);
    
    console.log('\n🔧 Execute este SQL no Supabase SQL Editor!');
    console.log('📋 Copie e cole o SQL acima no Supabase SQL Editor e execute.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verifyAndFixJsonbColumns();



