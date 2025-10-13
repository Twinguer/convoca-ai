import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function checkTableStructure() {
  console.log('🔍 Verificando estrutura real das tabelas...');
  
  try {
    // 1. Verificar estrutura da tabela rankings
    console.log('\n📊 Estrutura da tabela rankings:');
    
    const { data: rankingsData, error: rankingsError } = await supabase
      .from('rankings')
      .select('*')
      .limit(1);
    
    if (rankingsError) {
      console.log('❌ Erro ao verificar rankings:', rankingsError.message);
    } else {
      console.log('✅ Rankings acessível');
      if (rankingsData && rankingsData.length > 0) {
        console.log('📋 Colunas encontradas:', Object.keys(rankingsData[0]));
      } else {
        console.log('ℹ️ Tabela vazia - vamos tentar inserir um registro para ver a estrutura');
        
        // Tentar inserir um registro mínimo para ver a estrutura
        const { data: insertData, error: insertError } = await supabase
          .from('rankings')
          .insert({
            titulo: 'Teste Estrutura',
            status: 'Ativo'
          })
          .select();
        
        if (insertError) {
          console.log('❌ Erro ao inserir teste:', insertError.message);
        } else {
          console.log('✅ Estrutura identificada:', Object.keys(insertData[0]));
        }
      }
    }
    
    // 2. Verificar estrutura da tabela ranking_disciplines
    console.log('\n📊 Estrutura da tabela ranking_disciplines:');
    
    const { data: disciplinesData, error: disciplinesError } = await supabase
      .from('ranking_disciplines')
      .select('*')
      .limit(1);
    
    if (disciplinesError) {
      console.log('❌ Erro ao verificar ranking_disciplines:', disciplinesError.message);
    } else {
      console.log('✅ Ranking_disciplines acessível');
      if (disciplinesData && disciplinesData.length > 0) {
        console.log('📋 Colunas encontradas:', Object.keys(disciplinesData[0]));
      } else {
        console.log('ℹ️ Tabela vazia - vamos tentar inserir um registro para ver a estrutura');
        
        // Tentar inserir um registro mínimo para ver a estrutura
        const { data: insertData, error: insertError } = await supabase
          .from('ranking_disciplines')
          .insert({
            ranking_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            discipline_name: 'Teste'
          })
          .select();
        
        if (insertError) {
          console.log('❌ Erro ao inserir teste:', insertError.message);
        } else {
          console.log('✅ Estrutura identificada:', Object.keys(insertData[0]));
        }
      }
    }
    
    // 3. Verificar estrutura da tabela ranking_answers
    console.log('\n📊 Estrutura da tabela ranking_answers:');
    
    const { data: answersData, error: answersError } = await supabase
      .from('ranking_answers')
      .select('*')
      .limit(1);
    
    if (answersError) {
      console.log('❌ Erro ao verificar ranking_answers:', answersError.message);
    } else {
      console.log('✅ Ranking_answers acessível');
      if (answersData && answersData.length > 0) {
        console.log('📋 Colunas encontradas:', Object.keys(answersData[0]));
      } else {
        console.log('ℹ️ Tabela vazia - vamos tentar inserir um registro para ver a estrutura');
        
        // Tentar inserir um registro mínimo para ver a estrutura
        const { data: insertData, error: insertError } = await supabase
          .from('ranking_answers')
          .insert({
            ranking_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            booklet_id: 'AZUL',
            question_number: 1,
            correct_answer: 'A'
          })
          .select();
        
        if (insertError) {
          console.log('❌ Erro ao inserir teste:', insertError.message);
        } else {
          console.log('✅ Estrutura identificada:', Object.keys(insertData[0]));
        }
      }
    }
    
    // 4. Verificar se há rankings existentes
    console.log('\n📊 Verificando rankings existentes:');
    
    const { data: existingRankings, error: existingError } = await supabase
      .from('rankings')
      .select('id, titulo, status')
      .limit(5);
    
    if (existingError) {
      console.log('❌ Erro ao verificar rankings existentes:', existingError.message);
    } else {
      console.log('✅ Rankings existentes:', existingRankings?.length || 0);
      if (existingRankings && existingRankings.length > 0) {
        console.log('📋 Rankings encontrados:');
        existingRankings.forEach(ranking => {
          console.log(`  - ${ranking.id}: ${ranking.titulo} (${ranking.status})`);
        });
      }
    }
    
    console.log('\n🎉 Verificação de estrutura concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
checkTableStructure().catch(console.error);



