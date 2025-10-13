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

async function debugAnswerSheetBooklet() {
  console.log('🔍 Debugando AnswerSheet - seleção de caderno...\n');

  try {
    const rankingId = '79a941aa-3354-4522-9e90-96f40e377fe0';
    const concursoId = 'f2522ebf-efb5-4e4f-a543-75364c830c88';
    
    // 1. Verificar dados do user_ranking
    console.log('1. Verificando dados do user_ranking...');
    const { data: userRankingData, error: userRankingError } = await supabase
      .from('user_rankings')
      .select('*')
      .eq('id', rankingId)
      .single();
    
    console.log('✅ User ranking data:', userRankingData);
    console.log('✅ User ranking error:', userRankingError);
    
    if (userRankingError || !userRankingData) {
      console.error('❌ Erro ao buscar user_ranking:', userRankingError);
      return;
    }
    
    console.log('✅ selected_booklet:', userRankingData.selected_booklet);
    
    // 2. Verificar cadernos disponíveis
    console.log('\n2. Verificando cadernos disponíveis...');
    const { data: concursoData, error: concursoError } = await supabase
      .from('concursos')
      .select('exam_booklets')
      .eq('id', concursoId)
      .single();
    
    console.log('✅ Concurso data:', concursoData);
    console.log('✅ Concurso error:', concursoError);
    
    if (concursoError || !concursoData) {
      console.error('❌ Erro ao buscar concurso:', concursoError);
      return;
    }
    
    const booklets = concursoData?.exam_booklets || [];
    console.log('✅ Cadernos disponíveis:', booklets.length);
    booklets.forEach((booklet: any, index: number) => {
      console.log(`   ${index + 1}. ${booklet.name} (${booklet.id})`);
    });
    
    // 3. Verificar se o selected_booklet existe nos cadernos disponíveis
    console.log('\n3. Verificando compatibilidade...');
    const selectedBooklet = userRankingData.selected_booklet;
    
    if (selectedBooklet) {
      const bookletExists = booklets.some((b: any) => b.id === selectedBooklet);
      console.log(`✅ Caderno selecionado existe: ${bookletExists}`);
      
      if (bookletExists) {
        const booklet = booklets.find((b: any) => b.id === selectedBooklet);
        console.log(`✅ Caderno encontrado: ${booklet?.name}`);
      } else {
        console.log('❌ PROBLEMA: Caderno selecionado não existe nos cadernos disponíveis!');
        console.log('   - Caderno selecionado:', selectedBooklet);
        console.log('   - Cadernos disponíveis:', booklets.map((b: any) => b.id));
      }
    } else {
      console.log('❌ PROBLEMA: selected_booklet é null/undefined!');
    }
    
    // 4. Simular o que o AnswerSheet faria
    console.log('\n4. Simulando lógica do AnswerSheet...');
    
    // useEffect que define selectedBookletId
    let selectedBookletId = '';
    if (userRankingData?.selected_booklet && !selectedBookletId) {
      selectedBookletId = userRankingData.selected_booklet;
      console.log('✅ selectedBookletId definido como:', selectedBookletId);
    } else {
      console.log('❌ selectedBookletId não foi definido');
    }
    
    // Verificação que causa o erro
    if (!selectedBookletId) {
      console.log('❌ ERRO: selectedBookletId está vazio!');
      console.log('   Isso causará a mensagem: "É necessário selecionar um caderno de prova"');
    } else {
      console.log('✅ selectedBookletId está definido, AnswerSheet deve funcionar');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  }
}

debugAnswerSheetBooklet();



