import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Credenciais do convoca-ai (do arquivo conv.env)
const convocaAiUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const convocaAiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

// Credenciais do nomeia-ai (do arquivo .env)
const nomeiaAiUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const convocaAiClient = createClient(convocaAiUrl, convocaAiKey);
const nomeiaAiClient = createClient(nomeiaAiUrl, nomeiaAiKey);

async function analyzeConvocaAiJsonbStructure() {
  console.log('🔍 ANALISANDO ESTRUTURA JSONB DO CONVOCA-AI');
  console.log('=' .repeat(60));

  try {
    // 1. Analisar tabela concursos no convoca-ai
    console.log('1️⃣ Analisando tabela concursos no convoca-ai...');
    const { data: convocaConcursos, error: convocaError } = await convocaAiClient
      .from('concursos')
      .select('*')
      .limit(1);
      
    if (convocaError) {
      console.log('❌ Erro ao acessar concursos no convoca-ai:', convocaError);
    } else {
      console.log('✅ Conectado ao convoca-ai!');
      console.log('📊 Campos disponíveis em concursos:', Object.keys(convocaConcursos[0] || {}));
      
      // Verificar campos JSONB
      const jsonbFields = ['disciplines', 'subjects', 'form_config', 'official_answers', 'exam_booklets', 'metadata'];
      jsonbFields.forEach(field => {
        if (convocaConcursos[0] && convocaConcursos[0][field] !== undefined) {
          console.log(`📊 ${field}:`, convocaConcursos[0][field]);
        } else {
          console.log(`❌ ${field}: não encontrado`);
        }
      });
    }
    
    // 2. Analisar tabela rankings no convoca-ai
    console.log('\n2️⃣ Analisando tabela rankings no convoca-ai...');
    const { data: convocaRankings, error: convocaRankingsError } = await convocaAiClient
      .from('rankings')
      .select('*')
      .limit(1);
      
    if (convocaRankingsError) {
      console.log('❌ Erro ao acessar rankings no convoca-ai:', convocaRankingsError);
    } else {
      console.log('✅ Tabela rankings encontrada no convoca-ai!');
      console.log('📊 Campos disponíveis em rankings:', Object.keys(convocaRankings[0] || {}));
      
      // Verificar campos JSONB
      const jsonbFields = ['disciplines', 'subjects', 'form_config', 'official_answers', 'exam_booklets', 'metadata'];
      jsonbFields.forEach(field => {
        if (convocaRankings[0] && convocaRankings[0][field] !== undefined) {
          console.log(`📊 ${field}:`, convocaRankings[0][field]);
        } else {
          console.log(`❌ ${field}: não encontrado`);
        }
      });
    }
    
    // 3. Buscar ranking específico no convoca-ai
    console.log('\n3️⃣ Buscando ranking f2522ebf-efb5-4e4f-a543-75364c830c88 no convoca-ai...');
    const { data: specificRanking, error: specificError } = await convocaAiClient
      .from('rankings')
      .select('*')
      .eq('id', 'f2522ebf-efb5-4e4f-a543-75364c830c88')
      .single();
      
    if (specificError) {
      console.log('❌ Erro ao buscar ranking específico no convoca-ai:', specificError);
    } else {
      console.log('✅ Ranking específico encontrado no convoca-ai!');
      console.log('📊 Título:', specificRanking.titulo);
      console.log('📊 Campos disponíveis:', Object.keys(specificRanking));
      
      // Verificar campos JSONB
      const jsonbFields = ['disciplines', 'subjects', 'form_config', 'official_answers', 'exam_booklets', 'metadata'];
      jsonbFields.forEach(field => {
        if (specificRanking[field] !== undefined) {
          console.log(`📊 ${field}:`, specificRanking[field]);
        } else {
          console.log(`❌ ${field}: não encontrado`);
        }
      });
    }
    
    // 4. Comparar com nomeia-ai
    console.log('\n4️⃣ Comparando com nomeia-ai...');
    const { data: nomeiaRankings, error: nomeiaError } = await nomeiaAiClient
      .from('rankings')
      .select('*')
      .limit(1);
      
    if (nomeiaError) {
      console.log('❌ Erro ao acessar rankings no nomeia-ai:', nomeiaError);
    } else {
      console.log('✅ Tabela rankings encontrada no nomeia-ai!');
      console.log('📊 Campos disponíveis em rankings:', Object.keys(nomeiaRankings[0] || {}));
      
      // Verificar campos JSONB
      const jsonbFields = ['disciplines', 'subjects', 'form_config', 'official_answers', 'exam_booklets', 'metadata'];
      jsonbFields.forEach(field => {
        if (nomeiaRankings[0] && nomeiaRankings[0][field] !== undefined) {
          console.log(`📊 ${field}:`, nomeiaRankings[0][field]);
        } else {
          console.log(`❌ ${field}: não encontrado`);
        }
      });
    }
    
    // 5. Verificar estrutura das tabelas via SQL
    console.log('\n5️⃣ Verificando estrutura das tabelas via SQL...');
    
    // Estrutura concursos no convoca-ai
    console.log('\n📋 Estrutura concursos no convoca-ai:');
    try {
      const { data: convocaStructure, error: convocaStructureError } = await convocaAiClient
        .rpc('exec_sql', {
          sql: `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'concursos' 
              AND table_schema = 'public'
              AND data_type = 'jsonb'
            ORDER BY column_name;
          `
        });
      
      if (convocaStructureError) {
        console.log('❌ Erro ao verificar estrutura concursos:', convocaStructureError);
      } else {
        console.log('📊 Campos JSONB em concursos:', convocaStructure);
      }
    } catch (error) {
      console.log('❌ Erro ao executar SQL no convoca-ai:', error);
    }
    
    // Estrutura rankings no convoca-ai
    console.log('\n📋 Estrutura rankings no convoca-ai:');
    try {
      const { data: convocaRankingsStructure, error: convocaRankingsStructureError } = await convocaAiClient
        .rpc('exec_sql', {
          sql: `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'rankings' 
              AND table_schema = 'public'
              AND data_type = 'jsonb'
            ORDER BY column_name;
          `
        });
      
      if (convocaRankingsStructureError) {
        console.log('❌ Erro ao verificar estrutura rankings:', convocaRankingsStructureError);
      } else {
        console.log('📊 Campos JSONB em rankings:', convocaRankingsStructure);
      }
    } catch (error) {
      console.log('❌ Erro ao executar SQL no convoca-ai:', error);
    }
    
    // Estrutura rankings no nomeia-ai
    console.log('\n📋 Estrutura rankings no nomeia-ai:');
    try {
      const { data: nomeiaStructure, error: nomeiaStructureError } = await nomeiaAiClient
        .rpc('exec_sql', {
          sql: `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'rankings' 
              AND table_schema = 'public'
              AND data_type = 'jsonb'
            ORDER BY column_name;
          `
        });
      
      if (nomeiaStructureError) {
        console.log('❌ Erro ao verificar estrutura rankings nomeia-ai:', nomeiaStructureError);
      } else {
        console.log('📊 Campos JSONB em rankings nomeia-ai:', nomeiaStructure);
      }
    } catch (error) {
      console.log('❌ Erro ao executar SQL no nomeia-ai:', error);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

analyzeConvocaAiJsonbStructure();



