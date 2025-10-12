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

async function testFrontendAnswerSheet() {
  console.log('🧪 Testando frontend AnswerSheet...\n');

  try {
    const rankingId = '79a941aa-3354-4522-9e90-96f40e377fe0';
    const concursoId = 'f2522ebf-efb5-4e4f-a543-75364c830c88';
    
    // Simular exatamente o que o AnswerSheet faz
    console.log('1. Simulando query do user_ranking (AnswerSheet)...');
    const { data: userRankingData, error: userRankingError } = await supabase
      .from('user_rankings')
      .select('*')
      .eq('id', rankingId)
      .single();
    
    console.log('✅ User ranking data encontrado:', userRankingData ? 'SIM' : 'NÃO');
    console.log('✅ User ranking error:', userRankingError);
    
    if (userRankingError || !userRankingData) {
      console.error('❌ Erro ao buscar user_ranking:', userRankingError);
      return;
    }
    
    console.log('2. Simulando query dos cadernos (AnswerSheet)...');
    const { data: examBooklets, error: examBookletsError } = await supabase
      .from('concursos')
      .select('exam_booklets')
      .eq('id', concursoId)
      .single();
    
    console.log('✅ Exam booklets encontrados:', examBooklets ? 'SIM' : 'NÃO');
    console.log('✅ Exam booklets error:', examBookletsError);
    
    if (examBookletsError || !examBooklets) {
      console.error('❌ Erro ao buscar exam_booklets:', examBookletsError);
      return;
    }
    
    const booklets = examBooklets?.exam_booklets || [];
    console.log('✅ Cadernos disponíveis:', booklets.length);
    
    // Simular o useEffect do AnswerSheet
    console.log('\n3. Simulando useEffect do AnswerSheet...');
    let selectedBookletId = '';
    
    // Simular a lógica: if (userRankingData?.selected_booklet && !selectedBookletId)
    if (userRankingData?.selected_booklet && !selectedBookletId) {
      selectedBookletId = userRankingData.selected_booklet;
      console.log('✅ selectedBookletId definido como:', selectedBookletId);
    } else {
      console.log('❌ selectedBookletId não foi definido');
      console.log('   - userRankingData?.selected_booklet:', userRankingData?.selected_booklet);
      console.log('   - !selectedBookletId:', !selectedBookletId);
    }
    
    // Simular a verificação que causa o erro
    console.log('\n4. Simulando verificação de erro...');
    if (!selectedBookletId) {
      console.log('❌ ERRO: selectedBookletId está vazio!');
      console.log('   Isso causará a mensagem: "É necessário selecionar um caderno de prova"');
      console.log('   E mostrará: "Caderno não selecionado"');
    } else {
      console.log('✅ selectedBookletId está definido, AnswerSheet deve funcionar');
      
      // Verificar se o caderno existe
      const bookletExists = booklets.some((b: any) => b.id === selectedBookletId);
      if (bookletExists) {
        const booklet = booklets.find((b: any) => b.id === selectedBookletId);
        console.log(`✅ Caderno encontrado: ${booklet?.name}`);
        console.log('✅ AnswerSheet deve funcionar normalmente!');
      } else {
        console.log('❌ PROBLEMA: Caderno selecionado não existe nos cadernos disponíveis!');
      }
    }
    
    // Simular o que acontece quando há múltiplos cadernos
    console.log('\n5. Simulando lógica de múltiplos cadernos...');
    if (booklets.length > 1) {
      console.log('✅ Há múltiplos cadernos, seleção é obrigatória');
      if (!selectedBookletId) {
        console.log('❌ PROBLEMA: Usuário precisa selecionar um caderno manualmente');
        console.log('   - Isso pode acontecer se o useEffect não executou');
        console.log('   - Ou se há problema de timing no React');
      } else {
        console.log('✅ Caderno já selecionado automaticamente');
      }
    } else if (booklets.length === 1) {
      console.log('✅ Há apenas um caderno, deve ser selecionado automaticamente');
      if (!selectedBookletId) {
        console.log('❌ PROBLEMA: Caderno único não foi selecionado automaticamente');
      } else {
        console.log('✅ Caderno único selecionado corretamente');
      }
    } else {
      console.log('❌ PROBLEMA: Nenhum caderno disponível!');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testFrontendAnswerSheet();

