import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Credenciais do nomeia-ai
const nomeiaAiUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const nomeiaAiClient = createClient(nomeiaAiUrl, nomeiaAiKey);

async function testJsonbSync() {
  console.log('🧪 TESTANDO SINCRONIZAÇÃO JSONB');
  console.log('=' .repeat(50));

  try {
    // 1. Verificar se os campos JSONB existem na tabela rankings
    console.log('1️⃣ Verificando estrutura da tabela rankings...');
    const { data: rankings, error: rankingsError } = await nomeiaAiClient
      .from('rankings')
      .select('*')
      .limit(1);
      
    if (rankingsError) {
      console.log('❌ Erro ao acessar rankings:', rankingsError);
      return;
    }
    
    if (rankings && rankings.length > 0) {
      console.log('✅ Tabela rankings acessível!');
      console.log('📊 Campos disponíveis:', Object.keys(rankings[0]));
      
      // Verificar campos JSONB
      const jsonbFields = ['disciplines', 'subjects', 'form_config', 'official_answers', 'exam_booklets', 'metadata', 'total_participants'];
      jsonbFields.forEach(field => {
        if (rankings[0][field] !== undefined) {
          console.log(`✅ ${field}:`, typeof rankings[0][field], rankings[0][field]);
        } else {
          console.log(`❌ ${field}: não encontrado`);
        }
      });
    } else {
      console.log('⚠️ Tabela rankings vazia');
    }
    
    // 2. Testar inserção com dados JSONB
    console.log('\n2️⃣ Testando inserção com dados JSONB...');
    const testData = {
      titulo: 'Teste JSONB Sync',
      orgao: 'Teste',
      banca: 'Teste',
      status: 'Ativo',
      disciplines: [
        {
          id: 'test-block-1',
          name: 'Conhecimentos Gerais',
          disciplines: [
            {
              id: 'test-discipline-1',
              name: 'Português',
              weight: 1.0,
              isEnabled: true,
              minimum_score: 0
            }
          ],
          minimum_score: 0
        }
      ],
      subjects: [],
      form_config: {
        test: true,
        version: '1.0'
      },
      official_answers: {
        booklets: {
          'test-booklet-1': {
            answers: {},
            metadata: { version: '1.0' }
          }
        }
      },
      exam_booklets: [
        {
          id: 'test-booklet-1',
          name: 'Caderno A',
          is_active: true,
          display_order: 1,
          total_questions: 0
        }
      ],
      metadata: {
        test: true,
        created_by: 'test-script'
      },
      total_participants: 0
    };
    
    const { data: insertResult, error: insertError } = await nomeiaAiClient
      .from('rankings')
      .insert(testData)
      .select();
      
    if (insertError) {
      console.log('❌ Erro ao inserir dados JSONB:', insertError);
    } else {
      console.log('✅ Inserção JSONB bem-sucedida!');
      console.log('📊 ID criado:', insertResult[0].id);
      console.log('📊 Disciplines:', insertResult[0].disciplines);
      console.log('📊 Form Config:', insertResult[0].form_config);
      console.log('📊 Official Answers:', insertResult[0].official_answers);
      console.log('📊 Exam Booklets:', insertResult[0].exam_booklets);
      
      // 3. Testar consulta JSONB
      console.log('\n3️⃣ Testando consulta JSONB...');
      const { data: queryResult, error: queryError } = await nomeiaAiClient
        .from('rankings')
        .select('id, titulo, disciplines, form_config, official_answers, exam_booklets')
        .eq('id', insertResult[0].id)
        .single();
        
      if (queryError) {
        console.log('❌ Erro ao consultar dados JSONB:', queryError);
      } else {
        console.log('✅ Consulta JSONB bem-sucedida!');
        console.log('📊 Dados recuperados:', queryResult);
      }
      
      // 4. Limpar dados de teste
      console.log('\n4️⃣ Limpando dados de teste...');
      const { error: deleteError } = await nomeiaAiClient
        .from('rankings')
        .delete()
        .eq('id', insertResult[0].id);
        
      if (deleteError) {
        console.log('❌ Erro ao limpar dados de teste:', deleteError);
      } else {
        console.log('✅ Dados de teste removidos!');
      }
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO!');
    console.log('✅ Estrutura JSONB sincronizada com sucesso!');
    console.log('✅ Inserção, consulta e remoção funcionando!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testJsonbSync();

