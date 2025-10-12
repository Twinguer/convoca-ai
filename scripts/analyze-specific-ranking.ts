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

async function analyzeSpecificRanking() {
  console.log('🔍 Analisando ranking específico: 405a0447-9c15-461d-9975-cec79a58522f\n');

  try {
    const rankingId = '405a0447-9c15-461d-9975-cec79a58522f';
    
    // 1. Verificar se o ranking existe
    console.log('1. Verificando se o ranking existe...');
    const { data: ranking, error: rankingError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', rankingId)
      .single();
    
    if (rankingError) {
      console.error('❌ Erro ao buscar ranking:', rankingError);
      return;
    }
    
    if (!ranking) {
      console.log('❌ Ranking não encontrado!');
      return;
    }
    
    console.log('✅ Ranking encontrado:', ranking.titulo);
    console.log('✅ Órgão:', ranking.orgao);
    console.log('✅ Banca:', ranking.banca);
    console.log('✅ Status:', ranking.status);
    
    // 2. Verificar cadernos disponíveis
    console.log('\n2. Verificando cadernos disponíveis...');
    const booklets = ranking.exam_booklets || [];
    console.log('✅ Cadernos encontrados:', booklets.length);
    
    if (booklets.length === 0) {
      console.log('❌ PROBLEMA: Nenhum caderno disponível!');
      return;
    }
    
    booklets.forEach((booklet: any, index: number) => {
      console.log(`   ${index + 1}. ${booklet.name} (${booklet.id}) - Ordem: ${booklet.display_order}`);
    });
    
    // 3. Verificar participações existentes
    console.log('\n3. Verificando participações existentes...');
    const { data: participations, error: participationsError } = await supabase
      .from('user_rankings')
      .select('id, user_id, selected_booklet, reservation_type, created_at')
      .eq('concurso_id', rankingId)
      .order('created_at', { ascending: false });
    
    if (participationsError) {
      console.error('❌ Erro ao buscar participações:', participationsError);
      return;
    }
    
    console.log('✅ Participações encontradas:', participations?.length || 0);
    participations?.forEach((part, index) => {
      console.log(`   ${index + 1}. User: ${part.user_id.substring(0, 8)}...`);
      console.log(`      - Caderno: ${part.selected_booklet || 'NENHUM'}`);
      console.log(`      - Cota: ${part.reservation_type}`);
      console.log(`      - Criado: ${part.created_at}`);
    });
    
    // 4. Verificar dados consolidados
    console.log('\n4. Verificando dados consolidados...');
    const { data: consolidatedData, error: consolidatedError } = await supabase
      .from('consolidated_answers_by_concurso')
      .select('concurso_id, consolidated_data, created_at')
      .eq('concurso_id', rankingId)
      .maybeSingle();
    
    if (consolidatedError) {
      console.error('❌ Erro ao buscar dados consolidados:', consolidatedError);
    } else if (consolidatedData) {
      console.log('✅ Dados consolidados encontrados');
      const consolidated = consolidatedData.consolidated_data;
      console.log('   - Total de usuários:', Object.keys(consolidated.users || {}).length);
      console.log('   - Metadata:', consolidated.metadata);
    } else {
      console.log('⚠️ Nenhum dado consolidado encontrado');
    }
    
    // 5. Simular carregamento no frontend
    console.log('\n5. Simulando carregamento no frontend...');
    
    // Simular loadBooklets do ParticipationForm
    const sortedBooklets = booklets.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
    console.log('✅ Cadernos ordenados:', sortedBooklets.map(b => b.name));
    
    // Simular seleção automática
    let selectedBooklet = null;
    if (sortedBooklets.length === 1) {
      selectedBooklet = sortedBooklets[0].id;
      console.log('✅ Caderno único selecionado automaticamente:', sortedBooklets[0].name);
    } else {
      console.log('⚠️ Múltiplos cadernos - usuário deve selecionar manualmente');
      console.log('   - Cadernos disponíveis para seleção:', sortedBooklets.map(b => b.name));
    }
    
    // 6. Verificar se há problema na estrutura dos cadernos
    console.log('\n6. Verificando estrutura dos cadernos...');
    sortedBooklets.forEach((booklet: any, index: number) => {
      console.log(`   Caderno ${index + 1}:`);
      console.log(`     - ID: ${booklet.id}`);
      console.log(`     - Nome: ${booklet.name}`);
      console.log(`     - Display Order: ${booklet.display_order}`);
      console.log(`     - Is Active: ${booklet.is_active}`);
      console.log(`     - Total Questions: ${booklet.total_questions}`);
      
      // Verificar se o ID é válido
      if (!booklet.id || booklet.id === 'undefined' || booklet.id === 'null') {
        console.log('     ❌ PROBLEMA: ID inválido!');
      }
      
      // Verificar se o nome é válido
      if (!booklet.name || booklet.name.trim() === '') {
        console.log('     ❌ PROBLEMA: Nome inválido!');
      }
    });
    
    // 7. Testar se o BookletSelector funcionaria
    console.log('\n7. Testando BookletSelector...');
    
    if (sortedBooklets.length === 0) {
      console.log('❌ BookletSelector não seria exibido (nenhum caderno)');
    } else if (sortedBooklets.length === 1) {
      console.log('✅ BookletSelector seria exibido como caderno único');
      console.log('   - Caderno mostrado:', sortedBooklets[0].name);
    } else {
      console.log('✅ BookletSelector seria exibido como seletor múltiplo');
      console.log('   - Opções disponíveis:', sortedBooklets.map(b => b.name));
    }
    
    // 8. Verificar se há problema de timing
    console.log('\n8. Verificando possível problema de timing...');
    
    // Simular o que acontece quando o usuário clica em "Participar"
    console.log('   Simulando clique em "Participar"...');
    
    if (!selectedBooklet && sortedBooklets.length > 1) {
      console.log('❌ PROBLEMA: Usuário precisa selecionar um caderno manualmente');
      console.log('   - Mas a interface pode não estar mostrando o seletor');
      console.log('   - Ou o seletor pode não estar funcionando corretamente');
    } else if (selectedBooklet) {
      console.log('✅ Caderno já selecionado:', selectedBooklet);
    }
    
    console.log('\n🎯 DIAGNÓSTICO FINAL:');
    console.log('=' .repeat(50));
    
    if (sortedBooklets.length === 0) {
      console.log('❌ CAUSA RAIZ: Nenhum caderno disponível no ranking');
    } else if (sortedBooklets.length === 1) {
      console.log('✅ Ranking tem 1 caderno - deve funcionar automaticamente');
    } else {
      console.log('⚠️ Ranking tem múltiplos cadernos - usuário deve selecionar');
      console.log('   - Verificar se o BookletSelector está sendo exibido');
      console.log('   - Verificar se o seletor está funcionando corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
  }
}

analyzeSpecificRanking();
