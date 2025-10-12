import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function discoverRankingsColumns() {
  console.log('🔍 Descobrindo colunas da tabela rankings...');
  
  try {
    // Tentar inserir com diferentes combinações de campos
    const testFields = [
      { titulo: 'Teste 1', orgao: 'INEP', banca: 'INEP', status: 'Ativo' },
      { titulo: 'Teste 2', orgao: 'INEP', banca: 'INEP', status: 'Ativo', total_participants: 0 },
      { titulo: 'Teste 3', orgao: 'INEP', banca: 'INEP', status: 'Ativo', total_participants: 0, has_minimum_score: true },
      { titulo: 'Teste 4', orgao: 'INEP', banca: 'INEP', status: 'Ativo', total_participants: 0, has_minimum_score: true, total_minimum_score: 450 },
      { titulo: 'Teste 5', orgao: 'INEP', banca: 'INEP', status: 'Ativo', total_participants: 0, has_minimum_score: true, total_minimum_score: 450, wrong_answer_penalty: 0.25 },
      { titulo: 'Teste 6', orgao: 'INEP', banca: 'INEP', status: 'Ativo', total_participants: 0, has_minimum_score: true, total_minimum_score: 450, wrong_answer_penalty: 0.25, created_by: '11111111-1111-1111-1111-111111111111' }
    ];
    
    let workingFields = null;
    
    for (let i = 0; i < testFields.length; i++) {
      const fields = testFields[i];
      console.log(`\n🔧 Tentativa ${i + 1}: Testando campos:`, Object.keys(fields));
      
      const { data, error } = await supabase
        .from('rankings')
        .insert(fields)
        .select();
      
      if (error) {
        console.log(`❌ Erro na tentativa ${i + 1}:`, error.message);
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.log('🔍 Campo não existe, tentando próximo...');
          continue;
        }
      } else {
        console.log(`✅ Sucesso na tentativa ${i + 1}!`);
        console.log('📊 Dados inseridos:', data[0]);
        workingFields = fields;
        break;
      }
    }
    
    if (workingFields) {
      console.log('\n🎉 Campos funcionais encontrados:');
      console.log(workingFields);
      
      // Agora tentar adicionar mais campos um por um
      console.log('\n🔧 Testando campos adicionais...');
      
      const additionalFields = {
        descricao: 'Descrição do teste',
        data_inicio: '2024-01-01T00:00:00Z',
        data_fim: '2024-12-31T23:59:59Z',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      for (const [key, value] of Object.entries(additionalFields)) {
        console.log(`\n🔧 Testando campo: ${key}`);
        
        const testData = { ...workingFields, [key]: value };
        
        const { data, error } = await supabase
          .from('rankings')
          .insert(testData)
          .select();
        
        if (error) {
          console.log(`❌ Campo ${key} não existe:`, error.message);
        } else {
          console.log(`✅ Campo ${key} existe e funciona!`);
        }
      }
    } else {
      console.log('❌ Nenhuma combinação de campos funcionou');
    }
    
  } catch (error) {
    console.error('❌ Erro durante descoberta:', error);
  }
}

// Executar descoberta
discoverRankingsColumns().catch(console.error);

