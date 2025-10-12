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

async function phase2ConcursosStructure() {
  console.log('🚀 FASE 2: ADICIONANDO COLUNAS JSONB À TABELA CONCURSOS');
  console.log('=' .repeat(60));

  try {
    // 1. Adicionar colunas JSONB à tabela concursos
    console.log('\n📋 1. ADICIONANDO COLUNAS JSONB');
    console.log('=' .repeat(40));

    const addColumnsQueries = [
      // Adicionar colunas JSONB para dados consolidados
      'ALTER TABLE concursos ADD COLUMN IF NOT EXISTS official_answers JSONB DEFAULT \'{}\';',
      'ALTER TABLE concursos ADD COLUMN IF NOT EXISTS exam_booklets JSONB DEFAULT \'[]\';',
      'ALTER TABLE concursos ADD COLUMN IF NOT EXISTS form_config JSONB DEFAULT \'{}\';',
      'ALTER TABLE concursos ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\';',
      
      // Adicionar colunas para controle
      'ALTER TABLE concursos ADD COLUMN IF NOT EXISTS total_participants INTEGER DEFAULT 0;',
      'ALTER TABLE concursos ADD COLUMN IF NOT EXISTS wrong_answer_penalty NUMERIC DEFAULT 0;'
    ];

    for (const query of addColumnsQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`⚠️  Aviso: ${query.split(' ')[5]} - ${error.message}`);
        } else {
          console.log(`✅ Coluna adicionada: ${query.split(' ')[5]}`);
        }
      } catch (err) {
        console.log(`⚠️  Erro: ${query.split(' ')[5]} - ${err}`);
      }
    }

    // 2. Criar índices para performance
    console.log('\n📋 2. CRIANDO ÍNDICES PARA PERFORMANCE');
    console.log('=' .repeat(40));

    const indexQueries = [
      // Índices para consultas rápidas
      'CREATE INDEX IF NOT EXISTS idx_concursos_titulo ON concursos (titulo);',
      'CREATE INDEX IF NOT EXISTS idx_concursos_orgao ON concursos (orgao);',
      'CREATE INDEX IF NOT EXISTS idx_concursos_banca ON concursos (banca);',
      'CREATE INDEX IF NOT EXISTS idx_concursos_status ON concursos (status);',
      'CREATE INDEX IF NOT EXISTS idx_concursos_created_by ON concursos (created_by_user_id);',
      'CREATE INDEX IF NOT EXISTS idx_concursos_created_at ON concursos (created_at DESC);',
      
      // Índices GIN para JSONB
      'CREATE INDEX IF NOT EXISTS idx_concursos_official_answers_gin ON concursos USING GIN (official_answers);',
      'CREATE INDEX IF NOT EXISTS idx_concursos_exam_booklets_gin ON concursos USING GIN (exam_booklets);',
      'CREATE INDEX IF NOT EXISTS idx_concursos_form_config_gin ON concursos USING GIN (form_config);'
    ];

    for (const query of indexQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`⚠️  Aviso: ${query.split(' ')[5]} - ${error.message}`);
        } else {
          console.log(`✅ Índice criado: ${query.split(' ')[5]}`);
        }
      } catch (err) {
        console.log(`⚠️  Erro: ${query.split(' ')[5]} - ${err}`);
      }
    }

    // 3. Verificar estrutura atualizada
    console.log('\n📋 3. VERIFICANDO ESTRUTURA ATUALIZADA');
    console.log('=' .repeat(40));

    try {
      const { data: concursos, error } = await supabase
        .from('concursos')
        .select('*')
        .limit(1);

      if (error) {
        console.error('❌ Erro ao verificar concursos:', error);
      } else if (concursos && concursos.length > 0) {
        const sampleConcurso = concursos[0];
        console.log('✅ Estrutura da tabela concursos atualizada:');
        console.log('- Colunas principais:', Object.keys(sampleConcurso));
        console.log('- Dados JSONB:', {
          official_answers: sampleConcurso.official_answers ? 'Presente' : 'Ausente',
          exam_booklets: sampleConcurso.exam_booklets ? 'Presente' : 'Ausente',
          form_config: sampleConcurso.form_config ? 'Presente' : 'Ausente',
          metadata: sampleConcurso.metadata ? 'Presente' : 'Ausente',
        });
        console.log('- Controle:', {
          total_participants: sampleConcurso.total_participants,
          wrong_answer_penalty: sampleConcurso.wrong_answer_penalty
        });
      } else {
        console.log('⚠️ Tabela concursos vazia.');
      }
    } catch (err) {
      console.log(`⚠️  Erro ao verificar estrutura: ${err}`);
    }

    console.log('\n✅ FASE 2 CONCLUÍDA: Colunas JSONB adicionadas à tabela concursos');

  } catch (error) {
    console.error('❌ Erro na Fase 2:', error);
  }
}

phase2ConcursosStructure();

