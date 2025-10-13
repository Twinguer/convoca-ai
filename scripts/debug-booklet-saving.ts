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

async function debugBookletSaving() {
  console.log('🔍 Debugando salvamento de cadernos...\n');

  try {
    const rankingId = '915affbb-df09-4909-a0b3-c1cd3b113adb';
    
    // 1. Verificar estado atual
    console.log('1. Estado atual do ranking:');
    const { data: ranking, error: rankingError } = await supabase
      .from('concursos')
      .select('id, titulo, exam_booklets, created_at, updated_at')
      .eq('id', rankingId)
      .single();
    
    if (rankingError) {
      console.error('❌ Erro ao buscar ranking:', rankingError);
      return;
    }
    
    console.log('✅ Ranking:', ranking.titulo);
    console.log('✅ Criado:', ranking.created_at);
    console.log('✅ Atualizado:', ranking.updated_at);
    console.log('✅ exam_booklets JSONB:', ranking.exam_booklets?.length || 0, 'cadernos');
    
    // 2. Verificar cadernos na tabela antiga
    console.log('\n2. Cadernos na tabela exam_booklets:');
    const { data: bookletsTable, error: bookletsError } = await supabase
      .from('exam_booklets')
      .select('*')
      .eq('concurso_id', rankingId)
      .order('created_at', { ascending: false });
    
    if (bookletsError) {
      console.error('❌ Erro ao buscar cadernos da tabela:', bookletsError);
    } else {
      console.log('✅ Cadernos na tabela:', bookletsTable?.length || 0);
      if (bookletsTable && bookletsTable.length > 0) {
        bookletsTable.forEach((booklet: any, index: number) => {
          console.log(`   ${index + 1}. ${booklet.name} (${booklet.id})`);
          console.log(`      - Criado: ${booklet.created_at}`);
          console.log(`      - Atualizado: ${booklet.updated_at}`);
          console.log(`      - Display Order: ${booklet.display_order}`);
        });
      }
    }
    
    // 3. Verificar se há triggers ou funções que podem estar salvando na tabela antiga
    console.log('\n3. Verificando triggers e funções...');
    
    // Verificar se há função manage_exam_booklets ativa
    const { data: functions, error: functionsError } = await supabase
      .from('pg_proc')
      .select('proname, prosrc')
      .eq('proname', 'manage_exam_booklets');
    
    if (functionsError) {
      console.log('⚠️ Não foi possível verificar funções (normal)');
    } else if (functions && functions.length > 0) {
      console.log('⚠️ Função manage_exam_booklets ainda existe!');
      console.log('   - Pode estar sendo chamada automaticamente');
      console.log('   - Precisa ser removida ou atualizada');
    } else {
      console.log('✅ Função manage_exam_booklets não encontrada');
    }
    
    // 4. Simular criação de um novo caderno para ver onde é salvo
    console.log('\n4. Simulando criação de novo caderno...');
    
    const testBooklet = {
      id: crypto.randomUUID(),
      name: 'TESTE DEBUG',
      display_order: 99,
      is_active: true,
      total_questions: 0
    };
    
    console.log('   Testando salvamento no JSONB...');
    
    // Atualizar JSONB
    const { error: jsonbError } = await supabase
      .from('concursos')
      .update({ 
        exam_booklets: [...(ranking.exam_booklets || []), testBooklet]
      })
      .eq('id', rankingId);
    
    if (jsonbError) {
      console.error('❌ Erro ao salvar no JSONB:', jsonbError);
    } else {
      console.log('✅ Salvo no JSONB com sucesso');
    }
    
    // Verificar se foi salvo na tabela antiga também
    const { data: newBookletInTable } = await supabase
      .from('exam_booklets')
      .select('*')
      .eq('concurso_id', rankingId)
      .eq('name', 'TESTE DEBUG')
      .maybeSingle();
    
    if (newBookletInTable) {
      console.log('⚠️ PROBLEMA: Caderno também foi salvo na tabela antiga!');
      console.log('   - Há um trigger ou função que está duplicando os dados');
      console.log('   - Precisa investigar e remover');
    } else {
      console.log('✅ Caderno não foi salvo na tabela antiga (correto)');
    }
    
    // 5. Verificar se há triggers na tabela concursos
    console.log('\n5. Verificando triggers na tabela concursos...');
    
    // Verificar se há triggers que podem estar salvando na tabela antiga
    const { data: triggers, error: triggersError } = await supabase
      .from('pg_trigger')
      .select('tgname, tgrelid::regclass as table_name')
      .eq('tgrelid::regclass::text', 'concursos');
    
    if (triggersError) {
      console.log('⚠️ Não foi possível verificar triggers (normal)');
    } else if (triggers && triggers.length > 0) {
      console.log('⚠️ Triggers encontrados na tabela concursos:');
      triggers.forEach((trigger: any) => {
        console.log(`   - ${trigger.tgname} em ${trigger.table_name}`);
      });
    } else {
      console.log('✅ Nenhum trigger encontrado na tabela concursos');
    }
    
    // 6. Limpar dados de teste
    console.log('\n6. Limpando dados de teste...');
    
    // Remover do JSONB
    const { error: removeJsonbError } = await supabase
      .from('concursos')
      .update({ 
        exam_booklets: (ranking.exam_booklets || []).filter((b: any) => b.name !== 'TESTE DEBUG')
      })
      .eq('id', rankingId);
    
    if (removeJsonbError) {
      console.error('❌ Erro ao remover do JSONB:', removeJsonbError);
    } else {
      console.log('✅ Removido do JSONB');
    }
    
    // Remover da tabela se existir
    if (newBookletInTable) {
      const { error: removeTableError } = await supabase
        .from('exam_booklets')
        .delete()
        .eq('id', newBookletInTable.id);
      
      if (removeTableError) {
        console.error('❌ Erro ao remover da tabela:', removeTableError);
      } else {
        console.log('✅ Removido da tabela');
      }
    }
    
    console.log('\n🎯 DIAGNÓSTICO FINAL:');
    console.log('=' .repeat(50));
    
    if (bookletsTable && bookletsTable.length > 0) {
      console.log('❌ PROBLEMA: Dados ainda estão sendo salvos na tabela antiga');
      console.log('   - Possíveis causas:');
      console.log('     1. Função RPC manage_exam_booklets ainda ativa');
      console.log('     2. Trigger na tabela concursos duplicando dados');
      console.log('     3. Código frontend ainda chamando função antiga');
      console.log('   - SOLUÇÃO: Investigar e remover a causa raiz');
    } else {
      console.log('✅ Dados não estão sendo salvos na tabela antiga');
      console.log('   - Problema pode ser em outro lugar');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  }
}

debugBookletSaving();



