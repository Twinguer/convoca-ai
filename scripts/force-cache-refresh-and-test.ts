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

async function forceCacheRefreshAndTest() {
  console.log('🔄 FORÇANDO REFRESH DO CACHE E TESTANDO');
  console.log('=' .repeat(60));

  try {
    // 1. Aguardar um pouco para o cache se atualizar
    console.log('1️⃣ Aguardando 5 segundos para o cache se atualizar...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 2. Tentar inserção simples primeiro
    console.log('\n2️⃣ Tentando inserção simples...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('concursos')
      .insert({
        titulo: 'TESTE CACHE REFRESH',
        orgao: 'TESTE ORGÃO',
        banca: 'TESTE BANCA',
        status: 'Ativo'
      })
      .select();
      
    if (simpleError) {
      console.log('❌ Erro na inserção simples:', simpleError);
    } else {
      console.log('✅ Inserção simples funcionou!');
      const concursoId = simpleData[0].id;
      
      // 3. Tentar atualizar com JSONB
      console.log('\n3️⃣ Tentando atualizar com JSONB...');
      const { error: updateError } = await supabase
        .from('concursos')
        .update({
          disciplines: [
            {
              id: 'test-cache-1',
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
          metadata: { source: 'cache_test' },
          total_participants: 0
        })
        .eq('id', concursoId);
        
      if (updateError) {
        console.log('❌ Erro na atualização com JSONB:', updateError);
        
        // 4. Tentar inserção direta com JSONB
        console.log('\n4️⃣ Tentando inserção direta com JSONB...');
        const { data: directData, error: directError } = await supabase
          .from('concursos')
          .insert({
            titulo: 'TESTE DIRETO JSONB',
            orgao: 'TESTE ORGÃO DIRETO',
            banca: 'TESTE BANCA DIRETO',
            status: 'Ativo',
            disciplines: [
              {
                id: 'test-direct-1',
                name: 'História',
                type: 'specific_knowledge_1',
                isEnabled: true,
                questionCount: 15,
                weight: 1.5,
                minimum_score: 0
              }
            ],
            subjects: [{ name: 'História Geral' }],
            form_config: { direct_test: true },
            official_answers: { '1': 'B', '2': 'C' },
            exam_booklets: [{ id: 'b2', name: 'Caderno B', total_questions: 15 }],
            metadata: { source: 'direct_test' },
            total_participants: 0
          })
          .select();
          
        if (directError) {
          console.log('❌ Erro na inserção direta com JSONB:', directError);
        } else {
          console.log('🎉 Inserção direta com JSONB funcionou!');
          console.log('📊 Dados inseridos:', directData);
        }
      } else {
        console.log('✅ Atualização com JSONB funcionou!');
        
        // Verificar resultado
        const { data: finalData, error: finalError } = await supabase
          .from('concursos')
          .select('*')
          .eq('id', concursoId)
          .single();
          
        if (finalError) {
          console.log('❌ Erro ao buscar resultado final:', finalError);
        } else {
          console.log('🎉 Resultado final:');
          console.log('📊 ID:', finalData.id);
          console.log('📊 Título:', finalData.titulo);
          console.log('📊 Disciplines:', finalData.disciplines);
          console.log('📊 Exam Booklets:', finalData.exam_booklets);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

forceCacheRefreshAndTest();



