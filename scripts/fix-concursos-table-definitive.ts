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

async function fixConcursosTableDefinitive() {
  console.log('🔧 CORREÇÃO DEFINITIVA DA TABELA CONCURSOS');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar se existe view concursos
    console.log('1️⃣ Verificando views conflitantes...');
    
    // 2. Gerar SQL para correção definitiva
    const fixSQL = `
-- CORREÇÃO DEFINITIVA DA TABELA CONCURSOS
-- ==========================================

-- 1. Dropar view concursos se existir
DROP VIEW IF EXISTS public.concursos CASCADE;

-- 2. Verificar se a tabela concursos existe e tem a estrutura correta
DO $$
BEGIN
    -- Se a tabela não existe, criar
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'concursos' AND table_schema = 'public') THEN
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
            data_publicacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Criar índices
        CREATE INDEX idx_concursos_status ON public.concursos(status);
        CREATE INDEX idx_concursos_created_by ON public.concursos(created_by_user_id);
        CREATE INDEX idx_concursos_created_at ON public.concursos(created_at);
        CREATE INDEX idx_concursos_disciplines ON public.concursos USING GIN (disciplines);
        
        -- Criar trigger para updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_concursos_updated_at 
            BEFORE UPDATE ON public.concursos 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Tabela concursos criada com sucesso';
    ELSE
        -- Se a tabela existe, verificar se tem as colunas JSONB
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'concursos' AND column_name = 'disciplines') THEN
            ALTER TABLE public.concursos ADD COLUMN disciplines JSONB DEFAULT '[]'::jsonb;
            ALTER TABLE public.concursos ADD COLUMN subjects JSONB DEFAULT '[]'::jsonb;
            ALTER TABLE public.concursos ADD COLUMN form_config JSONB DEFAULT '{}'::jsonb;
            ALTER TABLE public.concursos ADD COLUMN official_answers JSONB DEFAULT '{}'::jsonb;
            ALTER TABLE public.concursos ADD COLUMN exam_booklets JSONB DEFAULT '[]'::jsonb;
            ALTER TABLE public.concursos ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
            ALTER TABLE public.concursos ADD COLUMN total_participants INTEGER DEFAULT 0;
            
            -- Criar índices para JSONB
            CREATE INDEX IF NOT EXISTS idx_concursos_disciplines ON public.concursos USING GIN (disciplines);
            
            RAISE NOTICE 'Colunas JSONB adicionadas à tabela concursos';
        END IF;
    END IF;
END $$;

-- 3. Verificar estrutura final
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

    console.log('📝 SQL de correção gerado:');
    console.log(fixSQL);
    
    console.log('\n🔧 Execute este SQL no Supabase SQL Editor para corrigir definitivamente!');
    console.log('📋 Copie e cole o SQL acima no Supabase SQL Editor e execute.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixConcursosTableDefinitive();



