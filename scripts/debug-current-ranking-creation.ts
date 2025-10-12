import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCurrentRankingCreation() {
  console.log('🔍 Debugando criação de ranking atual...\n');

  try {
    // 1. Verificar rankings mais recentes
    console.log('1. Verificando rankings mais recentes...');
    
    const { data: recentRankings, error: fetchError } = await supabase
      .from('concursos')
      .select('id, titulo, created_at, disciplines, exam_booklets, official_answers')
      .order('created_at', { ascending: false })
      .limit(5);

    if (fetchError) {
      console.error('❌ Erro ao buscar rankings:', fetchError);
      return;
    }

    console.log(`✅ Encontrados ${recentRankings.length} rankings recentes:`);
    recentRankings.forEach((ranking, index) => {
      console.log(`   ${index + 1}. ${ranking.titulo} (${ranking.id})`);
      console.log(`      - Criado: ${ranking.created_at}`);
      console.log(`      - Disciplinas: ${ranking.disciplines?.length || 0}`);
      console.log(`      - Cadernos: ${ranking.exam_booklets?.length || 0}`);
      console.log(`      - Gabaritos: ${Object.keys(ranking.official_answers || {}).length}`);
    });

    // 2. Verificar o ranking mais recente em detalhes
    if (recentRankings.length > 0) {
      const latestRanking = recentRankings[0];
      console.log(`\n2. Analisando ranking mais recente: ${latestRanking.titulo}`);
      
      // Buscar dados completos
      const { data: fullRanking, error: fullError } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', latestRanking.id)
        .single();

      if (fullError) {
        console.error('❌ Erro ao buscar dados completos:', fullError);
        return;
      }

      console.log('📊 Estrutura de prova:');
      console.log(`   - has_basic_knowledge: ${fullRanking.has_basic_knowledge}`);
      console.log(`   - basic_knowledge_questions: ${fullRanking.basic_knowledge_questions}`);
      console.log(`   - basic_knowledge_weight: ${fullRanking.basic_knowledge_weight}`);
      console.log(`   - has_specific_knowledge_1: ${fullRanking.has_specific_knowledge_1}`);
      console.log(`   - specific_knowledge_1_questions: ${fullRanking.specific_knowledge_1_questions}`);
      console.log(`   - has_custom_knowledge: ${fullRanking.has_custom_knowledge}`);
      console.log(`   - custom_knowledge_questions: ${fullRanking.custom_knowledge_questions}`);

      console.log('\n📚 Dados JSONB:');
      console.log(`   - Disciplinas: ${JSON.stringify(fullRanking.disciplines, null, 2)}`);
      console.log(`   - Cadernos: ${JSON.stringify(fullRanking.exam_booklets, null, 2)}`);
      console.log(`   - Gabaritos: ${JSON.stringify(fullRanking.official_answers, null, 2)}`);

      // 3. Verificar se a função createDisciplinesFromStructure funcionaria
      console.log('\n3. Simulando createDisciplinesFromStructure...');
      
      const simulatedDisciplines = createDisciplinesFromStructure(fullRanking);
      console.log(`   - Disciplinas que seriam criadas: ${simulatedDisciplines.length}`);
      simulatedDisciplines.forEach((discipline, index) => {
        console.log(`     ${index + 1}. ${discipline.name} (${discipline.questionCount} questões)`);
      });

      // 4. Verificar se há diferença entre disciplinas salvas e simuladas
      const currentDisciplines = fullRanking.disciplines || [];
      const hasDisciplines = currentDisciplines.length > 0;
      const shouldHaveDisciplines = simulatedDisciplines.length > 0;

      console.log('\n4. Análise do problema:');
      console.log(`   - Disciplinas atuais: ${currentDisciplines.length}`);
      console.log(`   - Disciplinas que deveriam existir: ${simulatedDisciplines.length}`);
      console.log(`   - Problema: ${hasDisciplines ? 'Tem disciplinas' : 'Não tem disciplinas'} vs ${shouldHaveDisciplines ? 'Deveria ter' : 'Não deveria ter'}`);

      if (!hasDisciplines && shouldHaveDisciplines) {
        console.log('❌ PROBLEMA IDENTIFICADO: Disciplinas não estão sendo criadas automaticamente');
        console.log('   - A função createDisciplinesFromStructure não está sendo chamada');
        console.log('   - Ou os dados não estão sendo salvos corretamente');
      } else if (hasDisciplines && shouldHaveDisciplines) {
        console.log('✅ Disciplinas estão sendo criadas corretamente');
      }
    }

  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

// Simular a função createDisciplinesFromStructure
const createDisciplinesFromStructure = (formValues: any): any[] => {
  const disciplines = [];

  if (formValues.has_basic_knowledge) {
    disciplines.push({
      id: 'basic-knowledge',
      name: 'Conhecimentos Básicos',
      type: 'basic_knowledge',
      isEnabled: true,
      questionCount: formValues.basic_knowledge_questions || 0,
      weight: formValues.basic_knowledge_weight || 1,
      minimum_score: 0
    });
  }

  if (formValues.has_specific_knowledge_1) {
    disciplines.push({
      id: 'specific-knowledge-1',
      name: 'Conhecimentos Específicos 1',
      type: 'specific_knowledge_1',
      isEnabled: true,
      questionCount: formValues.specific_knowledge_1_questions || 0,
      weight: formValues.specific_knowledge_1_weight || 1,
      minimum_score: 0
    });
  }

  if (formValues.has_custom_knowledge) {
    disciplines.push({
      id: 'custom-knowledge',
      name: 'Conhecimentos Customizados',
      type: 'custom_knowledge',
      isEnabled: true,
      questionCount: formValues.custom_knowledge_questions || 0,
      weight: formValues.custom_knowledge_weight || 1,
      minimum_score: 0
    });
  }

  return disciplines;
};

debugCurrentRankingCreation();

