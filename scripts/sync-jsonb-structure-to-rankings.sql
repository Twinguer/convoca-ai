-- SINCRONIZAR ESTRUTURA JSONB DO CONVOCA-AI PARA NOMEIA-AI
-- ========================================================
-- Baseado na análise: convoca-ai usa 'concursos' com JSONB, nomeia-ai usa 'rankings' sem JSONB

-- 1. Adicionar colunas JSONB à tabela rankings no nomeia-ai
ALTER TABLE public.rankings 
ADD COLUMN IF NOT EXISTS disciplines JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS subjects JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS form_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS official_answers JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS exam_booklets JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS total_participants INTEGER DEFAULT 0;

-- 2. Criar índices GIN para performance (otimização para consultas JSONB)
CREATE INDEX IF NOT EXISTS idx_rankings_disciplines_gin ON public.rankings USING GIN (disciplines);
CREATE INDEX IF NOT EXISTS idx_rankings_subjects_gin ON public.rankings USING GIN (subjects);
CREATE INDEX IF NOT EXISTS idx_rankings_form_config_gin ON public.rankings USING GIN (form_config);
CREATE INDEX IF NOT EXISTS idx_rankings_official_answers_gin ON public.rankings USING GIN (official_answers);
CREATE INDEX IF NOT EXISTS idx_rankings_exam_booklets_gin ON public.rankings USING GIN (exam_booklets);
CREATE INDEX IF NOT EXISTS idx_rankings_metadata_gin ON public.rankings USING GIN (metadata);

-- 3. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rankings' 
    AND table_schema = 'public'
    AND column_name IN ('disciplines', 'subjects', 'form_config', 'official_answers', 'exam_booklets', 'metadata', 'total_participants')
ORDER BY column_name;

-- 4. Testar inserção com dados JSONB (exemplo)
INSERT INTO public.rankings (
    titulo, 
    orgao, 
    banca, 
    status,
    disciplines,
    form_config,
    official_answers,
    exam_booklets
) VALUES (
    'Teste JSONB',
    'Teste',
    'Teste',
    'Ativo',
    '[{"id": "test", "name": "Teste", "disciplines": []}]'::jsonb,
    '{"test": true}'::jsonb,
    '{"booklets": {}}'::jsonb,
    '[{"id": "test", "name": "Teste"}]'::jsonb
) ON CONFLICT DO NOTHING;

-- 5. Verificar se a inserção funcionou
SELECT id, titulo, disciplines, form_config, official_answers, exam_booklets 
FROM public.rankings 
WHERE titulo = 'Teste JSONB';

-- 6. Limpar dados de teste
DELETE FROM public.rankings WHERE titulo = 'Teste JSONB';



