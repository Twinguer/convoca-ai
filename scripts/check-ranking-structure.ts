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

async function checkRankingStructure() {
  console.log('🔍 VERIFICANDO ESTRUTURA DO RANKING ESPECÍFICO');
  console.log('=' .repeat(60));

  try {
    // 1. Buscar o ranking específico com todos os campos
    console.log('1️⃣ Buscando ranking f2522ebf-efb5-4e4f-a543-75364c830c88...');
    const { data: rankingData, error: rankingError } = await supabase
      .from('rankings')
      .select('*')
      .eq('id', 'f2522ebf-efb5-4e4f-a543-75364c830c88')
      .single();
      
    if (rankingError) {
      console.log('❌ Erro ao buscar ranking:', rankingError);
    } else {
      console.log('✅ Ranking encontrado!');
      console.log('📊 Campos disponíveis:', Object.keys(rankingData));
      console.log('📊 Título:', rankingData.titulo);
      console.log('📊 Status:', rankingData.status);
      
      // Verificar se há campos JSONB
      const jsonbFields = ['disciplines', 'subjects', 'form_config', 'official_answers', 'exam_booklets', 'metadata'];
      jsonbFields.forEach(field => {
        if (rankingData[field] !== undefined) {
          console.log(`📊 ${field}:`, rankingData[field]);
        } else {
          console.log(`❌ ${field}: não encontrado`);
        }
      });
    }
    
    // 2. Tentar buscar apenas campos básicos
    console.log('\n2️⃣ Buscando apenas campos básicos...');
    const { data: basicData, error: basicError } = await supabase
      .from('rankings')
      .select('id, titulo, orgao, banca, status, exam_type, created_at')
      .eq('id', 'f2522ebf-efb5-4e4f-a543-75364c830c88')
      .single();
      
    if (basicError) {
      console.log('❌ Erro ao buscar campos básicos:', basicError);
    } else {
      console.log('✅ Campos básicos encontrados!');
      console.log('📊 Dados básicos:', basicData);
    }
    
    // 3. Tentar inserir apenas campos básicos
    console.log('\n3️⃣ Tentando inserir apenas campos básicos...');
    const { data: insertData, error: insertError } = await supabase
      .from('rankings')
      .insert({
        titulo: 'TESTE CAMPOS BÁSICOS',
        orgao: 'TESTE ORGÃO BÁSICO',
        banca: 'TESTE BANCA BÁSICO',
        status: 'Ativo',
        exam_type: 'Alternativas',
        has_minimum_score: false,
        total_minimum_score: 0,
        wrong_answer_penalty: 0.25
      })
      .select();
      
    if (insertError) {
      console.log('❌ Erro na inserção básica:', insertError);
    } else {
      console.log('✅ Inserção básica funcionou!');
      console.log('📊 Dados inseridos:', insertData);
      
      const rankingId = insertData[0].id;
      
      // 4. Tentar atualizar com JSONB
      console.log('\n4️⃣ Tentando atualizar com JSONB...');
      const { error: updateError } = await supabase
        .from('rankings')
        .update({
          disciplines: [
            {
              id: 'test-update-1',
              name: 'Matemática',
              type: 'basic_knowledge',
              isEnabled: true,
              questionCount: 10,
              weight: 1.0,
              minimum_score: 0
            }
          ]
        })
        .eq('id', rankingId);
        
      if (updateError) {
        console.log('❌ Erro na atualização com JSONB:', updateError);
      } else {
        console.log('✅ Atualização com JSONB funcionou!');
        
        // Verificar resultado
        const { data: finalData, error: finalError } = await supabase
          .from('rankings')
          .select('*')
          .eq('id', rankingId)
          .single();
          
        if (finalError) {
          console.log('❌ Erro ao verificar resultado:', finalError);
        } else {
          console.log('🎉 Resultado final:');
          console.log('📊 Disciplines:', finalData.disciplines);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkRankingStructure();



