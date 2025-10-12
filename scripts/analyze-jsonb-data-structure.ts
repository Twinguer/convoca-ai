import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Credenciais do convoca-ai
const convocaAiUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const convocaAiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const convocaAiClient = createClient(convocaAiUrl, convocaAiKey);

async function analyzeJsonbDataStructure() {
  console.log('🔍 ANÁLISE DETALHADA DA ESTRUTURA JSONB NO CONVOCA-AI');
  console.log('=' .repeat(70));

  try {
    // 1. Buscar um concurso com dados JSONB completos
    console.log('1️⃣ Buscando concurso com dados JSONB completos...');
    const { data: concursos, error: concursosError } = await convocaAiClient
      .from('concursos')
      .select('id, titulo, disciplines, form_config, official_answers, exam_booklets, metadata')
      .not('disciplines', 'is', null)
      .limit(1);
      
    if (concursosError) {
      console.log('❌ Erro ao buscar concursos:', concursosError);
      return;
    }
    
    if (!concursos || concursos.length === 0) {
      console.log('❌ Nenhum concurso com dados JSONB encontrado');
      return;
    }
    
    const concurso = concursos[0];
    console.log('✅ Concurso encontrado:', concurso.titulo);
    console.log('📊 ID:', concurso.id);
    
    // 2. Analisar estrutura de disciplines
    console.log('\n2️⃣ ESTRUTURA DE DISCIPLINES:');
    console.log('=' .repeat(40));
    if (concurso.disciplines) {
      console.log('📊 Tipo:', typeof concurso.disciplines);
      console.log('📊 É Array:', Array.isArray(concurso.disciplines));
      console.log('📊 Tamanho:', Array.isArray(concurso.disciplines) ? concurso.disciplines.length : 'N/A');
      
      if (Array.isArray(concurso.disciplines)) {
        concurso.disciplines.forEach((block, index) => {
          console.log(`\n📋 Bloco ${index + 1}:`);
          console.log('  - ID:', block.id);
          console.log('  - Nome:', block.name);
          console.log('  - Minimum Score:', block.minimum_score);
          console.log('  - Disciplinas:', block.disciplines ? block.disciplines.length : 0);
          
          if (block.disciplines && Array.isArray(block.disciplines)) {
            block.disciplines.forEach((discipline, discIndex) => {
              console.log(`    📚 Disciplina ${discIndex + 1}:`);
              console.log('      - ID:', discipline.id);
              console.log('      - Nome:', discipline.name);
              console.log('      - Tipo:', discipline.type);
              console.log('      - Peso:', discipline.weight);
              console.log('      - Habilitada:', discipline.isEnabled);
              console.log('      - Questões:', discipline.questionCount);
              console.log('      - Mínimo:', discipline.minimum_score);
            });
          }
        });
      }
    } else {
      console.log('❌ Campo disciplines não encontrado ou vazio');
    }
    
    // 3. Analisar estrutura de form_config
    console.log('\n3️⃣ ESTRUTURA DE FORM_CONFIG:');
    console.log('=' .repeat(40));
    if (concurso.form_config) {
      console.log('📊 Tipo:', typeof concurso.form_config);
      console.log('📊 Chaves:', Object.keys(concurso.form_config));
      
      if (concurso.form_config.users) {
        console.log('📊 Usuários:', Object.keys(concurso.form_config.users).length);
        const userIds = Object.keys(concurso.form_config.users);
        if (userIds.length > 0) {
          const firstUser = concurso.form_config.users[userIds[0]];
          console.log('📊 Estrutura do primeiro usuário:');
          console.log('  - Nome:', firstUser.user_name);
          console.log('  - Cadernos:', firstUser.booklets ? Object.keys(firstUser.booklets).length : 0);
          console.log('  - Caderno selecionado:', firstUser.selected_booklet);
          console.log('  - Contagem de edições:', firstUser.edit_count);
          console.log('  - Última atualização:', firstUser.last_updated);
        }
      }
      
      if (concurso.form_config.metadata) {
        console.log('📊 Metadados:');
        console.log('  - Versão:', concurso.form_config.metadata.version);
        console.log('  - Total de usuários:', concurso.form_config.metadata.total_users);
        console.log('  - Última atualização:', concurso.form_config.metadata.last_updated);
      }
    } else {
      console.log('❌ Campo form_config não encontrado ou vazio');
    }
    
    // 4. Analisar estrutura de official_answers
    console.log('\n4️⃣ ESTRUTURA DE OFFICIAL_ANSWERS:');
    console.log('=' .repeat(40));
    if (concurso.official_answers) {
      console.log('📊 Tipo:', typeof concurso.official_answers);
      console.log('📊 Chaves:', Object.keys(concurso.official_answers));
      
      if (concurso.official_answers.booklets) {
        console.log('📊 Cadernos:', Object.keys(concurso.official_answers.booklets).length);
        const bookletIds = Object.keys(concurso.official_answers.booklets);
        if (bookletIds.length > 0) {
          const firstBooklet = concurso.official_answers.booklets[bookletIds[0]];
          console.log('📊 Estrutura do primeiro caderno:');
          console.log('  - ID:', bookletIds[0]);
          console.log('  - Respostas:', firstBooklet.answers ? Object.keys(firstBooklet.answers).length : 0);
          console.log('  - Metadados:', firstBooklet.metadata);
          
          if (firstBooklet.answers) {
            const answerKeys = Object.keys(firstBooklet.answers);
            if (answerKeys.length > 0) {
              console.log('  - Primeiras 5 respostas:');
              answerKeys.slice(0, 5).forEach(key => {
                console.log(`    ${key}: ${firstBooklet.answers[key]}`);
              });
            }
          }
        }
      }
      
      if (concurso.official_answers.metadata) {
        console.log('📊 Metadados:');
        console.log('  - Versão:', concurso.official_answers.metadata.version);
        console.log('  - Última atualização:', concurso.official_answers.metadata.last_updated);
      }
    } else {
      console.log('❌ Campo official_answers não encontrado ou vazio');
    }
    
    // 5. Analisar estrutura de exam_booklets
    console.log('\n5️⃣ ESTRUTURA DE EXAM_BOOKLETS:');
    console.log('=' .repeat(40));
    if (concurso.exam_booklets) {
      console.log('📊 Tipo:', typeof concurso.exam_booklets);
      console.log('📊 É Array:', Array.isArray(concurso.exam_booklets));
      console.log('📊 Tamanho:', Array.isArray(concurso.exam_booklets) ? concurso.exam_booklets.length : 'N/A');
      
      if (Array.isArray(concurso.exam_booklets)) {
        concurso.exam_booklets.forEach((booklet, index) => {
          console.log(`\n📚 Caderno ${index + 1}:`);
          console.log('  - ID:', booklet.id);
          console.log('  - Nome:', booklet.name);
          console.log('  - Ativo:', booklet.is_active);
          console.log('  - Ordem:', booklet.display_order);
          console.log('  - Total de questões:', booklet.total_questions);
        });
      }
    } else {
      console.log('❌ Campo exam_booklets não encontrado ou vazio');
    }
    
    // 6. Analisar estrutura de metadata
    console.log('\n6️⃣ ESTRUTURA DE METADATA:');
    console.log('=' .repeat(40));
    if (concurso.metadata) {
      console.log('📊 Tipo:', typeof concurso.metadata);
      console.log('📊 Chaves:', Object.keys(concurso.metadata));
      console.log('📊 Conteúdo:', concurso.metadata);
    } else {
      console.log('❌ Campo metadata não encontrado ou vazio');
    }
    
    // 7. Gerar exemplo de inserção
    console.log('\n7️⃣ EXEMPLO DE INSERÇÃO PARA NOMEIA-AI:');
    console.log('=' .repeat(50));
    
    const exampleInsert = {
      titulo: 'Exemplo de Ranking',
      orgao: 'Exemplo Orgão',
      banca: 'Exemplo Banca',
      status: 'Ativo',
      disciplines: concurso.disciplines || [],
      subjects: [],
      form_config: concurso.form_config || {},
      official_answers: concurso.official_answers || {},
      exam_booklets: concurso.exam_booklets || [],
      metadata: concurso.metadata || {},
      total_participants: 0
    };
    
    console.log('📝 Exemplo de dados para inserção:');
    console.log(JSON.stringify(exampleInsert, null, 2));
    
    console.log('\n🎉 ANÁLISE CONCLUÍDA!');
    console.log('✅ Estrutura JSONB do convoca-ai mapeada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

analyzeJsonbDataStructure();

