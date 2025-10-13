import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis do arquivo conv.env (convoca-ai)
config({ path: 'conv.env', override: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeRankingCreationFlow() {
  console.log('🔍 Analisando fluxo de criação de rankings...\n');

  try {
    const rankingId = '405a0447-9c15-461d-9975-cec79a58522f';
    
    // 1. Verificar estrutura atual do ranking
    console.log('1. Verificando estrutura atual do ranking...');
    const { data: ranking, error: rankingError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', rankingId)
      .single();
    
    if (rankingError) {
      console.error('❌ Erro ao buscar ranking:', rankingError);
      return;
    }
    
    console.log('✅ Ranking encontrado:', ranking.titulo);
    console.log('✅ Estrutura JSONB atual:');
    console.log('   - disciplines:', ranking.disciplines ? '✅' : '❌');
    console.log('   - subjects:', ranking.subjects ? '✅' : '❌');
    console.log('   - form_config:', ranking.form_config ? '✅' : '❌');
    console.log('   - official_answers:', ranking.official_answers ? '✅' : '❌');
    console.log('   - exam_booklets:', ranking.exam_booklets ? '✅' : '❌');
    console.log('   - metadata:', ranking.metadata ? '✅' : '❌');
    
    // 2. Verificar dados na tabela exam_booklets (estrutura antiga)
    console.log('\n2. Verificando dados na tabela exam_booklets (estrutura antiga)...');
    const { data: bookletsTable, error: bookletsError } = await supabase
      .from('exam_booklets')
      .select('*')
      .eq('concurso_id', rankingId);
    
    if (bookletsError) {
      console.error('❌ Erro ao buscar cadernos da tabela:', bookletsError);
    } else {
      console.log('✅ Cadernos na tabela exam_booklets:', bookletsTable?.length || 0);
      if (bookletsTable && bookletsTable.length > 0) {
        bookletsTable.forEach((booklet: any, index: number) => {
          console.log(`   ${index + 1}. ${booklet.name} (${booklet.id})`);
        });
      }
    }
    
    // 3. Verificar dados na tabela official_answer_weights (estrutura antiga)
    console.log('\n3. Verificando dados na tabela official_answer_weights (estrutura antiga)...');
    const { data: weightsTable, error: weightsError } = await supabase
      .from('official_answer_weights')
      .select('*')
      .eq('concurso_id', rankingId);
    
    if (weightsError) {
      console.error('❌ Erro ao buscar pesos da tabela:', weightsError);
    } else {
      console.log('✅ Pesos na tabela official_answer_weights:', weightsTable?.length || 0);
      if (weightsTable && weightsTable.length > 0) {
        weightsTable.forEach((weight: any, index: number) => {
          console.log(`   ${index + 1}. Disciplina: ${weight.discipline_name}, Peso: ${weight.weight}`);
        });
      }
    }
    
    // 4. Verificar dados na tabela consolidated_answers_by_concurso (estrutura antiga)
    console.log('\n4. Verificando dados na tabela consolidated_answers_by_concurso (estrutura antiga)...');
    const { data: consolidatedTable, error: consolidatedError } = await supabase
      .from('consolidated_answers_by_concurso')
      .select('*')
      .eq('concurso_id', rankingId);
    
    if (consolidatedError) {
      console.error('❌ Erro ao buscar dados consolidados:', consolidatedError);
    } else {
      console.log('✅ Dados consolidados:', consolidatedTable?.length || 0);
      if (consolidatedTable && consolidatedTable.length > 0) {
        console.log('   - Estrutura:', Object.keys(consolidatedTable[0].consolidated_data || {}));
      }
    }
    
    // 5. Verificar se há dados em outros rankings para referência
    console.log('\n5. Verificando outros rankings com dados JSONB...');
    const { data: otherRankings } = await supabase
      .from('concursos')
      .select('id, titulo, disciplines, subjects, form_config, official_answers, exam_booklets, metadata')
      .not('exam_booklets', 'is', null)
      .limit(3);
    
    if (otherRankings && otherRankings.length > 0) {
      console.log('✅ Rankings com dados JSONB encontrados:');
      otherRankings.forEach((r: any, index: number) => {
        console.log(`   ${index + 1}. ${r.titulo} (${r.id})`);
        console.log(`      - disciplines: ${r.disciplines ? '✅' : '❌'}`);
        console.log(`      - subjects: ${r.subjects ? '✅' : '❌'}`);
        console.log(`      - form_config: ${r.form_config ? '✅' : '❌'}`);
        console.log(`      - official_answers: ${r.official_answers ? '✅' : '❌'}`);
        console.log(`      - exam_booklets: ${r.exam_booklets ? '✅' : '❌'}`);
        console.log(`      - metadata: ${r.metadata ? '✅' : '❌'}`);
      });
    }
    
    // 6. Verificar se o problema está no frontend (useSaveRanking)
    console.log('\n6. Verificando se o problema está no frontend...');
    console.log('   - O useSaveRanking.ts está salvando na estrutura JSONB?');
    console.log('   - O ExamBookletsSection.tsx está salvando no JSONB?');
    console.log('   - O GeneralTab.tsx está salvando no JSONB?');
    
    // 7. Propor solução
    console.log('\n7. PROPOSTA DE SOLUÇÃO:');
    console.log('=' .repeat(50));
    
    if (!ranking.exam_booklets || ranking.exam_booklets.length === 0) {
      console.log('❌ PROBLEMA: exam_booklets JSONB está vazio');
      console.log('   - Dados existem na tabela exam_booklets (estrutura antiga)');
      console.log('   - Frontend não está salvando na estrutura JSONB');
      console.log('   - Precisa corrigir o fluxo de criação/salvamento');
    }
    
    if (!ranking.official_answers) {
      console.log('❌ PROBLEMA: official_answers JSONB está vazio');
      console.log('   - Dados podem existir na tabela official_answer_weights');
      console.log('   - Precisa migrar e corrigir o fluxo de salvamento');
    }
    
    if (!ranking.disciplines) {
      console.log('❌ PROBLEMA: disciplines JSONB está vazio');
      console.log('   - Dados podem existir na tabela official_answer_weights');
      console.log('   - Precisa migrar e corrigir o fluxo de salvamento');
    }
    
    console.log('\n🔧 AÇÕES NECESSÁRIAS:');
    console.log('1. Corrigir useSaveRanking.ts para sempre salvar na estrutura JSONB');
    console.log('2. Corrigir ExamBookletsSection.tsx para salvar no JSONB');
    console.log('3. Corrigir GeneralTab.tsx para salvar no JSONB');
    console.log('4. Migrar dados existentes das tabelas antigas para JSONB');
    console.log('5. Remover dependências das tabelas antigas');
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
  }
}

analyzeRankingCreationFlow();



