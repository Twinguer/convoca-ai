import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis do arquivo conv.env
config({ path: 'conv.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas no conv.env');
  console.error('URL:', supabaseUrl ? 'OK' : 'FALTANDO');
  console.error('KEY:', supabaseKey ? 'OK' : 'FALTANDO');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeConvocaAiStructure() {
  console.log('🔍 ANALISANDO ESTRUTURA DO BANCO CONVOCA-AI');
  console.log('=' .repeat(60));

  try {
    // 1. Analisar tabela concursos
    console.log('\n📊 1. TABELA CONCURSOS:');
    const { data: concursos, error: concursosError } = await supabase
      .from('concursos')
      .select('*')
      .limit(1);

    if (concursosError) {
      console.error('❌ Erro ao buscar concursos:', concursosError);
    } else {
      console.log('✅ Estrutura da tabela concursos:');
      console.log('- Colunas principais:', Object.keys(concursos[0] || {}));
      console.log('- Dados JSONB:', {
        disciplines: concursos[0]?.disciplines ? 'Presente' : 'Ausente',
        subjects: concursos[0]?.subjects ? 'Presente' : 'Ausente',
        temp_disciplines_data: concursos[0]?.temp_disciplines_data ? 'Presente' : 'Ausente'
      });
    }

    // 2. Analisar tabela official_answer_weights
    console.log('\n📊 2. TABELA OFFICIAL_ANSWER_WEIGHTS:');
    const { data: weights, error: weightsError } = await supabase
      .from('official_answer_weights')
      .select('*')
      .limit(1);

    if (weightsError) {
      console.error('❌ Erro ao buscar official_answer_weights:', weightsError);
    } else {
      console.log('✅ Estrutura da tabela official_answer_weights:');
      console.log('- Colunas:', Object.keys(weights[0] || {}));
      console.log('- consolidated_answer_data:', weights[0]?.consolidated_answer_data ? 'Presente' : 'Ausente');
    }

    // 3. Analisar tabela consolidated_answers_by_concurso
    console.log('\n📊 3. TABELA CONSOLIDATED_ANSWERS_BY_CONCURSO:');
    const { data: consolidated, error: consolidatedError } = await supabase
      .from('consolidated_answers_by_concurso')
      .select('*')
      .limit(1);

    if (consolidatedError) {
      console.error('❌ Erro ao buscar consolidated_answers_by_concurso:', consolidatedError);
    } else {
      console.log('✅ Estrutura da tabela consolidated_answers_by_concurso:');
      console.log('- Colunas:', Object.keys(consolidated[0] || {}));
      console.log('- consolidated_data:', consolidated[0]?.consolidated_data ? 'Presente' : 'Ausente');
    }

    // 4. Analisar tabela exam_booklets
    console.log('\n📊 4. TABELA EXAM_BOOKLETS:');
    const { data: booklets, error: bookletsError } = await supabase
      .from('exam_booklets')
      .select('*')
      .limit(5);

    if (bookletsError) {
      console.error('❌ Erro ao buscar exam_booklets:', bookletsError);
    } else {
      console.log('✅ Estrutura da tabela exam_booklets:');
      console.log('- Colunas:', Object.keys(booklets[0] || {}));
      console.log('- Registros encontrados:', booklets.length);
    }

    // 5. Analisar tabela user_rankings vs user_ranking_new
    console.log('\n📊 5. COMPARAÇÃO USER_RANKINGS vs USER_RANKING_NEW:');
    
    const { data: userRankings, error: userRankingsError } = await supabase
      .from('user_rankings')
      .select('*')
      .limit(1);

    const { data: userRankingNew, error: userRankingNewError } = await supabase
      .from('user_ranking_new')
      .select('*')
      .limit(1);

    console.log('✅ user_rankings:', userRankingsError ? 'Erro' : `${Object.keys(userRankings[0] || {}).length} colunas`);
    console.log('✅ user_ranking_new:', userRankingNewError ? 'Erro' : `${Object.keys(userRankingNew[0] || {}).length} colunas`);

    // 6. Propor estrutura consolidada
    console.log('\n🎯 PROPOSTA DE ESTRUTURA CONSOLIDADA:');
    console.log('=' .repeat(60));

    console.log(`
📋 TABELA UNIFICADA: rankings
├── 📝 Dados do Formulário (de concursos)
│   ├── id, titulo, orgao, banca, exam_type
│   ├── has_minimum_score, total_minimum_score, wrong_answer_penalty
│   ├── disciplines (JSONB) - estrutura hierárquica
│   └── subjects (JSONB) - matérias customizadas
├── 🎯 Gabarito Oficial (de official_answer_weights)
│   └── official_answers (JSONB) - estrutura consolidada
├── 📚 Cadernos (de exam_booklets)
│   └── exam_booklets (JSONB) - array de cadernos
└── 📊 Metadados
    ├── created_at, updated_at, created_by
    └── status, total_participants

📋 TABELA UNIFICADA: user_rankings
├── 👤 Dados do Usuário
│   ├── id, ranking_id, user_id
│   ├── score, position, reservation_type
│   └── created_at, updated_at
├── 📝 Respostas (de user_ranking_new)
│   └── user_answers (JSONB) - estrutura consolidada
├── 🧮 Cálculos (de user_ranking_new)
│   └── calculated_scores (JSONB) - scores calculados
└── 📊 Metadados
    └── metadata (JSONB) - informações adicionais
`);

    // 7. Vantagens da estrutura consolidada
    console.log('\n✅ VANTAGENS DA ESTRUTURA CONSOLIDADA:');
    console.log(`
1. 🎯 UMA TABELA PRINCIPAL: rankings
   - Todos os dados do formulário em uma linha
   - Gabarito oficial integrado (JSONB)
   - Cadernos integrados (JSONB)
   - Disciplinas hierárquicas (JSONB)

2. 👥 UMA TABELA DE PARTICIPAÇÕES: user_rankings
   - Respostas do usuário (JSONB)
   - Cálculos de pontuação (JSONB)
   - Metadados de participação (JSONB)

3. 🚀 PERFORMANCE OTIMIZADA:
   - Menos JOINs necessários
   - Dados relacionados em uma consulta
   - Índices GIN para JSONB
   - Cache mais eficiente

4. 🔧 MANUTENÇÃO SIMPLIFICADA:
   - Estrutura mais limpa
   - Menos tabelas para gerenciar
   - Migração mais direta
   - Backup mais simples

5. 📈 ESCALABILIDADE:
   - JSONB otimizado para consultas
   - Particionamento por ranking_id
   - Limpeza automática de dados antigos
   - Estatísticas pré-calculadas
`);

    // 8. Estrutura JSONB proposta
    console.log('\n📋 ESTRUTURA JSONB PROPOSTA:');
    console.log(`
🎯 rankings.official_answers:
{
  "booklets": {
    "booklet_id": {
      "booklet_name": "Caderno A",
      "answers": {
        "1": {
          "correct_answer": "A",
          "weight": 1,
          "is_nullified": false,
          "section_type": "custom_8b37a263"
        }
      },
      "metadata": {
        "total_questions": 15,
        "last_updated": "2025-10-11T15:50:19.665758+00:00"
      }
    }
  },
  "metadata": {
    "version": "1.0",
    "last_updated": "2025-10-11T15:50:42.579304+00:00"
  }
}

📚 rankings.exam_booklets:
[
  {
    "id": "657755ad-bf1e-45ed-83f7-d13b7e0dc682",
    "name": "T1",
    "display_order": 1,
    "total_questions": 15
  },
  {
    "id": "effc00ba-a96e-41c8-b2dc-cf1e62051a8f", 
    "name": "T2",
    "display_order": 2,
    "total_questions": 15
  }
]

👥 user_rankings.user_answers:
{
  "booklets": {
    "booklet_id": {
      "answers": {
        "1": {
          "user_answer": "A",
          "is_blank": false,
          "answered_at": "2025-10-11T16:05:15.530364+00:00",
          "time_spent_seconds": 120
        }
      },
      "metadata": {
        "answer_count": 15,
        "completed_at": "2025-10-11T16:05:15.530364+00:00"
      }
    }
  },
  "metadata": {
    "last_updated": "2025-10-11T16:05:15.530364+00:00",
    "submission_count": 1,
    "completion_percentage": 100
  }
}
`);

    console.log('\n🎉 ANÁLISE CONCLUÍDA!');
    console.log('A estrutura consolidada aproveita o melhor de cada tabela existente.');

  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

analyzeConvocaAiStructure();
