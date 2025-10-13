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

async function checkWhichTableHasJsonb() {
  console.log('🔍 VERIFICANDO QUAL TABELA TEM COLUNAS JSONB');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar tabela concursos
    console.log('1️⃣ Verificando tabela concursos...');
    const { data: concursosData, error: concursosError } = await supabase
      .from('concursos')
      .select('id, titulo, disciplines')
      .limit(1);
      
    if (concursosError) {
      console.log('❌ Erro na tabela concursos:', concursosError);
    } else {
      console.log('✅ Tabela concursos acessível');
      console.log('📊 Dados:', concursosData);
    }
    
    // 2. Verificar tabela rankings
    console.log('\n2️⃣ Verificando tabela rankings...');
    const { data: rankingsData, error: rankingsError } = await supabase
      .from('rankings')
      .select('id, titulo, disciplines')
      .limit(1);
      
    if (rankingsError) {
      console.log('❌ Erro na tabela rankings:', rankingsError);
    } else {
      console.log('✅ Tabela rankings acessível');
      console.log('📊 Dados:', rankingsData);
    }
    
    // 3. Verificar o ranking específico que você mencionou
    console.log('\n3️⃣ Verificando ranking específico f2522ebf-efb5-4e4f-a543-75364c830c88...');
    const { data: specificRanking, error: specificError } = await supabase
      .from('rankings')
      .select('*')
      .eq('id', 'f2522ebf-efb5-4e4f-a543-75364c830c88')
      .single();
      
    if (specificError) {
      console.log('❌ Erro ao buscar ranking específico:', specificError);
    } else {
      console.log('✅ Ranking específico encontrado!');
      console.log('📊 Título:', specificRanking.titulo);
      console.log('📊 Disciplines:', specificRanking.disciplines);
      console.log('📊 Tabela:', 'rankings');
    }
    
    // 4. Tentar inserir na tabela rankings
    console.log('\n4️⃣ Tentando inserir na tabela rankings...');
    const { data: insertData, error: insertError } = await supabase
      .from('rankings')
      .insert({
        titulo: 'TESTE RANKINGS TABLE',
        orgao: 'TESTE ORGÃO RANKINGS',
        banca: 'TESTE BANCA RANKINGS',
        status: 'Ativo',
        exam_type: 'Alternativas',
        has_minimum_score: false,
        total_minimum_score: 0,
        wrong_answer_penalty: 0.25,
        disciplines: [
          {
            id: 'test-rankings-1',
            name: 'Matemática',
            type: 'basic_knowledge',
            isEnabled: true,
            questionCount: 10,
            weight: 1.0,
            minimum_score: 0
          }
        ],
        subjects: [{ name: 'Matemática Básica' }],
        form_config: { test: true },
        official_answers: { '1': 'A' },
        exam_booklets: [{ id: 'b1', name: 'Caderno A', total_questions: 10 }],
        metadata: { source: 'rankings_test' },
        total_participants: 0
      })
      .select();
      
    if (insertError) {
      console.log('❌ Erro na inserção na tabela rankings:', insertError);
    } else {
      console.log('🎉 Inserção na tabela rankings funcionou!');
      console.log('📊 Dados inseridos:', insertData);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkWhichTableHasJsonb();



