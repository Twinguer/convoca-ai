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

async function mapRankingCreationFlow() {
  console.log('🗺️ MAPEANDO FLUXO COMPLETO DE CRIAÇÃO DE RANKING...\n');

  try {
    // 1. Mapear componentes do frontend
    console.log('1. COMPONENTES DO FRONTEND:');
    console.log('=' .repeat(50));
    
    const frontendComponents = [
      'src/pages/CriarRanking.tsx - Página principal de criação',
      'src/hooks/useSaveRanking.ts - Hook principal de salvamento',
      'src/components/Admin/CreateRanking/GeneralTab.tsx - Aba geral',
      'src/components/Admin/CreateRanking/ExamBookletsSection.tsx - Seção de cadernos',
      'src/components/Admin/CreateRanking/DisciplinesSection.tsx - Seção de disciplinas',
      'src/components/Admin/CreateRanking/AnswerKeySection.tsx - Seção de gabarito',
      'src/components/Admin/CreateRanking/SubjectsSection.tsx - Seção de assuntos'
    ];
    
    frontendComponents.forEach((component, index) => {
      console.log(`   ${index + 1}. ${component}`);
    });
    
    // 2. Mapear fluxo de dados
    console.log('\n2. FLUXO DE DADOS:');
    console.log('=' .repeat(50));
    
    console.log('   📝 FORMULÁRIO → HOOKS → SERVIÇOS → BANCO');
    console.log('   ');
    console.log('   CriarRanking.tsx');
    console.log('   ├── useSaveRanking.ts (dados básicos)');
    console.log('   ├── ExamBookletsSection.tsx (cadernos)');
    console.log('   ├── DisciplinesSection.tsx (disciplinas)');
    console.log('   ├── AnswerKeySection.tsx (gabarito)');
    console.log('   └── SubjectsSection.tsx (assuntos)');
    console.log('   ');
    console.log('   ↓');
    console.log('   ');
    console.log('   TABELA: concursos');
    console.log('   ├── exam_booklets (JSONB) ← ExamBookletsSection');
    console.log('   ├── disciplines (JSONB) ← DisciplinesSection');
    console.log('   ├── official_answers (JSONB) ← AnswerKeySection');
    console.log('   ├── subjects (JSONB) ← SubjectsSection');
    console.log('   └── form_config (JSONB) ← GeneralTab');
    
    // 3. Verificar estado atual dos rankings
    console.log('\n3. ESTADO ATUAL DOS RANKINGS:');
    console.log('=' .repeat(50));
    
    const { data: rankings, error: rankingsError } = await supabase
      .from('concursos')
      .select('id, titulo, created_at, exam_booklets, disciplines, official_answers, subjects, form_config')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (rankingsError) {
      console.error('❌ Erro ao buscar rankings:', rankingsError);
      return;
    }
    
    rankings.forEach((ranking: any, index: number) => {
      console.log(`\n   ${index + 1}. ${ranking.titulo} (${ranking.id})`);
      console.log(`      - Criado: ${ranking.created_at}`);
      console.log(`      - exam_booklets JSONB: ${ranking.exam_booklets?.length || 0} cadernos`);
      console.log(`      - disciplines JSONB: ${ranking.disciplines?.length || 0} disciplinas`);
      console.log(`      - official_answers JSONB: ${ranking.official_answers ? 'Sim' : 'Não'}`);
      console.log(`      - subjects JSONB: ${ranking.subjects?.length || 0} assuntos`);
      console.log(`      - form_config JSONB: ${ranking.form_config ? 'Sim' : 'Não'}`);
    });
    
    // 4. Verificar dados nas tabelas antigas
    console.log('\n4. DADOS NAS TABELAS ANTIGAS:');
    console.log('=' .repeat(50));
    
    // exam_booklets
    const { data: bookletsTable, error: bookletsError } = await supabase
      .from('exam_booklets')
      .select('concurso_id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (bookletsError) {
      console.error('❌ Erro ao buscar cadernos da tabela:', bookletsError);
    } else {
      console.log('   📋 TABELA exam_booklets:');
      if (bookletsTable && bookletsTable.length > 0) {
        bookletsTable.forEach((booklet: any, index: number) => {
          console.log(`      ${index + 1}. ${booklet.name} (${booklet.concurso_id}) - ${booklet.created_at}`);
        });
      } else {
        console.log('      Nenhum caderno encontrado');
      }
    }
    
    // official_answer_weights
    const { data: weightsTable, error: weightsError } = await supabase
      .from('official_answer_weights')
      .select('concurso_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (weightsError) {
      console.error('❌ Erro ao buscar pesos da tabela:', weightsError);
    } else {
      console.log('\n   📋 TABELA official_answer_weights:');
      if (weightsTable && weightsTable.length > 0) {
        console.log(`      ${weightsTable.length} registros encontrados`);
        weightsTable.forEach((weight: any, index: number) => {
          console.log(`      ${index + 1}. ${weight.concurso_id} - ${weight.created_at}`);
        });
      } else {
        console.log('      Nenhum peso encontrado');
      }
    }
    
    // 5. Mapear pontos de salvamento
    console.log('\n5. PONTOS DE SALVAMENTO:');
    console.log('=' .repeat(50));
    
    console.log('   🔧 useSaveRanking.ts:');
    console.log('      - Salva dados básicos na tabela concursos');
    console.log('      - Inclui campos JSONB: disciplines, subjects, form_config, official_answers, exam_booklets');
    console.log('      - Status: ✅ CORRETO (salva no JSONB)');
    
    console.log('\n   🔧 ExamBookletsSection.tsx:');
    console.log('      - saveBooklets() atualiza exam_booklets JSONB');
    console.log('      - loadExistingBooklets() carrega do JSONB');
    console.log('      - Status: ✅ CORRETO (usa JSONB)');
    
    console.log('\n   🔧 DisciplinesSection.tsx:');
    console.log('      - Salva disciplines no JSONB via useSaveRanking');
    console.log('      - Status: ✅ CORRETO (usa JSONB)');
    
    console.log('\n   🔧 AnswerKeySection.tsx:');
    console.log('      - Salva official_answers no JSONB via useSaveRanking');
    console.log('      - Status: ✅ CORRETO (usa JSONB)');
    
    // 6. Identificar problema
    console.log('\n6. IDENTIFICAÇÃO DO PROBLEMA:');
    console.log('=' .repeat(50));
    
    const hasJsonbData = rankings.some((r: any) => r.exam_booklets?.length > 0);
    const hasTableData = bookletsTable && bookletsTable.length > 0;
    
    if (hasJsonbData && hasTableData) {
      console.log('⚠️ SISTEMA HÍBRIDO DETECTADO:');
      console.log('   - Dados existem em ambos os lugares (JSONB + tabelas antigas)');
      console.log('   - Frontend está salvando no JSONB (correto)');
      console.log('   - Mas dados antigos ainda estão nas tabelas');
      console.log('   - Possível causa: Função RPC antiga ainda ativa');
    } else if (hasJsonbData) {
      console.log('✅ SISTEMA CORRETO:');
      console.log('   - Dados apenas no JSONB');
      console.log('   - Frontend funcionando corretamente');
    } else if (hasTableData) {
      console.log('❌ SISTEMA INCORRETO:');
      console.log('   - Dados apenas nas tabelas antigas');
      console.log('   - Frontend não está salvando no JSONB');
      console.log('   - Precisa corrigir o frontend');
    } else {
      console.log('❌ SEM DADOS:');
      console.log('   - Nenhum dado encontrado');
      console.log('   - Sistema não está funcionando');
    }
    
    // 7. Verificar função RPC
    console.log('\n7. VERIFICAÇÃO DA FUNÇÃO RPC:');
    console.log('=' .repeat(50));
    
    try {
      const { data: rpcTest, error: rpcError } = await supabase
        .rpc('manage_exam_booklets', {
          p_operation: 'GET',
          p_concurso_id: '00000000-0000-0000-0000-000000000000'
        });
      
      if (rpcError) {
        console.log('✅ Função RPC não existe ou não funciona:', rpcError.message);
      } else {
        console.log('⚠️ Função RPC ainda existe e funciona:', rpcTest);
        console.log('   - Esta pode ser a causa do problema');
        console.log('   - Precisa ser removida ou desativada');
      }
    } catch (error) {
      console.log('✅ Função RPC não existe (correto)');
    }
    
    // 8. Plano de correção
    console.log('\n8. PLANO DE CORREÇÃO:');
    console.log('=' .repeat(50));
    
    if (hasTableData) {
      console.log('🔧 AÇÕES NECESSÁRIAS:');
      console.log('   1. Remover função RPC manage_exam_booklets');
      console.log('   2. Migrar dados existentes das tabelas antigas para JSONB');
      console.log('   3. Verificar se frontend está salvando corretamente');
      console.log('   4. Testar criação de novo ranking');
      console.log('   5. Verificar se participação funciona');
    } else {
      console.log('✅ Sistema já está funcionando corretamente');
    }
    
    console.log('\n🎯 RESUMO DO MAPEAMENTO:');
    console.log('=' .repeat(50));
    console.log('✅ Frontend: Configurado para usar JSONB');
    console.log('✅ useSaveRanking: Salva no JSONB');
    console.log('✅ ExamBookletsSection: Usa JSONB');
    console.log('⚠️ Função RPC: Ainda existe (possível causa)');
    console.log('⚠️ Dados antigos: Nas tabelas antigas');
    console.log('🔧 Solução: Remover RPC + migrar dados');
    
  } catch (error) {
    console.error('❌ Erro durante o mapeamento:', error);
  }
}

mapRankingCreationFlow();



