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

async function createInsertConcursoRpc() {
  console.log('🔧 CRIANDO FUNÇÃO RPC PARA INSERÇÃO DE CONCURSOS');
  console.log('=' .repeat(60));

  try {
    // SQL para criar função RPC que contorna o problema do schema cache
    const rpcSQL = `
-- CRIAR FUNÇÃO RPC PARA INSERÇÃO DE CONCURSOS
-- ===========================================

CREATE OR REPLACE FUNCTION insert_concurso_complete(
  p_titulo TEXT,
  p_orgao TEXT,
  p_banca TEXT,
  p_status TEXT DEFAULT 'Ativo',
  p_exam_type TEXT DEFAULT 'Alternativas',
  p_has_minimum_score BOOLEAN DEFAULT false,
  p_total_minimum_score NUMERIC DEFAULT 0,
  p_wrong_answer_penalty NUMERIC DEFAULT 0.25,
  p_alternatives_count INTEGER DEFAULT 5,
  p_has_custom_knowledge BOOLEAN DEFAULT true,
  p_created_by_user_id UUID DEFAULT NULL,
  p_disciplines JSONB DEFAULT '[]'::jsonb,
  p_subjects JSONB DEFAULT '[]'::jsonb,
  p_form_config JSONB DEFAULT '{}'::jsonb,
  p_official_answers JSONB DEFAULT '{}'::jsonb,
  p_exam_booklets JSONB DEFAULT '[]'::jsonb,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_total_participants INTEGER DEFAULT 0
) RETURNS UUID AS $$
DECLARE
  concurso_id UUID;
BEGIN
  INSERT INTO public.concursos (
    titulo, 
    orgao, 
    banca, 
    status, 
    exam_type,
    has_minimum_score,
    total_minimum_score,
    wrong_answer_penalty,
    alternatives_count,
    has_custom_knowledge,
    created_by_user_id,
    disciplines,
    subjects,
    form_config,
    official_answers,
    exam_booklets,
    metadata,
    total_participants
  ) VALUES (
    p_titulo, 
    p_orgao, 
    p_banca, 
    p_status, 
    p_exam_type,
    p_has_minimum_score,
    p_total_minimum_score,
    p_wrong_answer_penalty,
    p_alternatives_count,
    p_has_custom_knowledge,
    p_created_by_user_id,
    p_disciplines,
    p_subjects,
    p_form_config,
    p_official_answers,
    p_exam_booklets,
    p_metadata,
    p_total_participants
  ) RETURNING id INTO concurso_id;
  
  RETURN concurso_id;
END;
$$ LANGUAGE plpgsql;

-- Testar a função
SELECT insert_concurso_complete(
  'TESTE RPC FUNCTION',
  'TESTE ORGÃO RPC',
  'TESTE BANCA RPC',
  'Ativo',
  'Alternativas',
  false,
  0,
  0.25,
  5,
  true,
  NULL,
  '[{"id": "test-rpc-1", "name": "Matemática", "type": "basic_knowledge", "isEnabled": true, "questionCount": 10, "weight": 1.0, "minimum_score": 0}]'::jsonb,
  '[{"name": "Matemática Básica"}]'::jsonb,
  '{"test": true}'::jsonb,
  '{"1": "A", "2": "B"}'::jsonb,
  '[{"id": "b1", "name": "Caderno A", "total_questions": 10}]'::jsonb,
  '{"source": "rpc_test"}'::jsonb,
  0
) as concurso_id;
`;

    console.log('📝 SQL para criar função RPC:');
    console.log(rpcSQL);
    
    console.log('\n🔧 Execute este SQL no Supabase SQL Editor!');
    console.log('📋 Copie e cole o SQL acima no Supabase SQL Editor e execute.');
    console.log('\n💡 Esta função RPC contorna o problema do schema cache do Supabase!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createInsertConcursoRpc();



